exports.executeWorkflow = require('./executeWorkflow')
exports.signalWorkflowExecution = require('./signalWorkflowExecution')
exports.terminateAllExecutions = () =>
  console.warn(
    'terminateAllExecutions() does nothing with LocalWorkflow backend'
  )
exports.terminateExecution = () =>
  console.warn('terminateExecution() does nothing with LocalWorkflow backend')
