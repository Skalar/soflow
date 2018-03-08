const config = require('../config')

async function terminateExecution({
  namespace = config.namespace,
  domain = config.swfDomain,
  prefixWorkflowId = true,
  workflowId: givenWorkflowId,
  reason = 'no reason given',
  runId,
  childPolicy = 'TERMINATE',
} = {}) {
  const swf = new config.AWS.SWF()

  const workflowId = prefixWorkflowId
    ? `${namespace}_${givenWorkflowId}`
    : givenWorkflowId

  try {
    return await swf
      .terminateExecutionExecution({
        domain,
        workflowId,
        runId,
        reason,
        childPolicy,
      })
      .promise()
  } catch (error) {
    if (error.code !== 'UnknownResourceFault') throw error
  }
}

module.exports = terminateExecution
