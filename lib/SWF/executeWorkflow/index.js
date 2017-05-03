import AWS from 'aws-sdk'
import {WorkflowError} from '~/lib/Errors'

const swf = new AWS.SWF({region: process.env.AWS_DEFAULT_REGION})
const iam = new AWS.IAM({region: process.env.AWS_DEFAULT_REGION})

async function executeWorkflow({
  namespace,
  domain,
  id: workflowId,
  type,
  version,
  input = {},
  childPolicy = 'TERMINATE',
  executionStartToCloseTimeout = 20,
  tagList = [namespace],
  taskPriority,
  taskStartToCloseTimeout = 5,
  workflowTypeVersion,
  waitForCompletion = true,
}) {
  const {Role: {Arn: lambdaRoleArn}} = await iam.getRole({
    RoleName: `${namespace}_swfRole`
  }).promise()

  const executionResult = await swf.startWorkflowExecution({
    domain,
    workflowId,
    workflowType: {
      name: `${namespace}_${type}`,
      version: workflowTypeVersion || version,
    },
    childPolicy,
    executionStartToCloseTimeout: String(executionStartToCloseTimeout),
    input: JSON.stringify(input),
    lambdaRole: lambdaRoleArn,
    tagList,
    taskPriority,
    taskList: {
      name: `${namespace}_${version}`
    },
    taskStartToCloseTimeout: String(taskStartToCloseTimeout),
  }).promise()

  if (waitForCompletion) {
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
      const {name, message, stackTrace} = callback.error
      throw new WorkflowError({name, message, stackTrace})
    }

    return callback.result
  }

  return executionResult
}


export default executeWorkflow
