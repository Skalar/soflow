const WorkflowExecutions = require('./WorkflowExecutions')

function signalWorkflowExecution(
  context,
  {signalName, workflowId, input} = {}
) {
  const decisionContext = WorkflowExecutions[workflowId]

  if (!decisionContext) {
    throw new Error('Unknown workflow exeution')
  }

  decisionContext.registerIncomingSignal(signalName, input)
}

module.exports = signalWorkflowExecution
