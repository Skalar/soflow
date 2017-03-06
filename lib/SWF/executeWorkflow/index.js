import AWS from 'aws-sdk'

const swf = new AWS.SWF({region: 'eu-west-1'})

async function executeWorkflow({
  namespace,
  domain,
  id: workflowId,
  type,
  version,
  input = {},
  childPolicy = 'TERMINATE',
  executionStartToCloseTimeout = 60,
  tagList = [],
  taskPriority,
  taskStartToCloseTimeout = 5,
  lambdaRole,
}) {
  await swf.startWorkflowExecution({
    domain,
    workflowId,
    workflowType: {
      name: `${namespace}_${type}`,
      version,
    },
    childPolicy,
    executionStartToCloseTimeout: String(executionStartToCloseTimeout),
    input: JSON.stringify(input),
    lambdaRole,
    tagList,
    taskPriority,
    taskStartToCloseTimeout: String(taskStartToCloseTimeout),
  }).promise()

  const callbackActivityTask = await swf.pollForActivityTask({
    domain,
    taskList: {name: workflowId},
    identity: 'callback'
  }).promise()

  const {taskToken, input: callbackJSON} = callbackActivityTask

  if (!taskToken) {
    throw new Error('Timeout')
  }

  await swf.respondActivityTaskCompleted({taskToken}).promise()

  const callback = JSON.parse(callbackJSON)

  if (callback.error) {
    throw callback.error
  }

  return callback.result
}


export default executeWorkflow
