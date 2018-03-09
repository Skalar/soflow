const config = require('../config')
const DecisionContext = require('./DecisionContext')
const WorkflowExecutions = require('./WorkflowExecutions')

function executeWorkflow({
  type,
  input,
  workflowId,
  codeRoot = config.codeRoot,
  workflowsPath = config.workflowsPath,
  tasksPath = config.tasksPath,
} = {}) {
  const workflows = require(`${codeRoot}/${workflowsPath}`)
  const workflowFunction = workflows[type]
  const decisionContext = new DecisionContext({
    input,
    codeRoot,
    workflowsPath,
    tasksPath,
    workflowType: type,
  })
  WorkflowExecutions[workflowId] = decisionContext
  const promise = workflowFunction(decisionContext)

  return {
    runId: 'placeholder',
    promise,
  }
}

module.exports = executeWorkflow
