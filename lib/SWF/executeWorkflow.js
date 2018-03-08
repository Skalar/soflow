const config = require('../config')
const get = require('lodash.get')

async function executeWorkflow({
  namespace = config.namespace,
  workflowPrefix = config.workflowPrefix,
  codeRoot = config.codeRoot,
  workflowsPath = config.workflowsPath,
  domain = config.swfDomain,
  type,
  workflowId = type,
  prefixWorkflowId = true,
  version = config.workflowsVersion,
  input = {},
  childPolicy = 'TERMINATE',
  startToCloseTimeout: providedStartToCloseTimeout,
  tagList = [namespace],
  taskPriority,
  taskStartToCloseTimeout = 5,
  taskList = `${namespace}_${version}`,
  lambdaRoleName = `${namespace}_swfRole`,
}) {
  const AWS = config.AWS
  const swf = new AWS.SWF()
  const iam = new AWS.IAM()

  const workflows = require(`${codeRoot}/${workflowsPath}`)
  const workflowFunction = workflows[type]

  const {Role: {Arn: lambdaRoleArn}} = await iam
    .getRole({
      RoleName: lambdaRoleName,
    })
    .promise()

  const startToCloseTimeout =
    providedStartToCloseTimeout ||
    get(workflowFunction, 'config.startToCloseTimeout')

  if (!startToCloseTimeout) {
    throw new Error('startToCloseTimeout not specified')
  }

  const startResponse = await swf
    .startWorkflowExecution({
      domain,
      workflowId: prefixWorkflowId
        ? [namespace, workflowId].filter(v => v).join('_')
        : workflowId,
      workflowType: {
        name: [workflowPrefix, type].filter(v => v).join('_'),
        version,
      },
      childPolicy,
      executionStartToCloseTimeout: String(startToCloseTimeout),
      input: JSON.stringify(input),
      lambdaRole: lambdaRoleArn,
      tagList,
      taskPriority,
      taskList: {
        name: taskList,
      },
      taskStartToCloseTimeout: String(taskStartToCloseTimeout),
    })
    .promise()

  const response = {
    ...startResponse,

    async retrieveResult() {
      let timedOut = false
      const activeRequest = null

      const timer = setTimeout(() => {
        timedOut = true
        if (activeRequest) activeRequest.abort()
      }, startToCloseTimeout * 1000)

      while (!timedOut) {
        const callbackActivityTask = await swf
          .pollForActivityTask({
            domain,
            taskList: {name: startResponse.runId},
            identity: 'callback',
          })
          .promise()

        const {taskToken, input: callbackJSON} = callbackActivityTask

        if (taskToken) {
          clearTimeout(timer)
          await swf.respondActivityTaskCompleted({taskToken}).promise()

          const callback = JSON.parse(callbackJSON)

          if (callback.error) {
            throw callback.error
          }

          return callback.result
        }
      }

      throw new Error('Workflow execution timed out')
    },
  }

  Object.defineProperty(response, 'promise', {
    enumerable: false,
    get() {
      return this.retrieveResult()
    },
  })

  return response
}

module.exports = executeWorkflow
