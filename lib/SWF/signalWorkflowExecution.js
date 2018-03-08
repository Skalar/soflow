const config = require('../config')

module.exports = async function signalWorkflowExecution({
  input,
  domain = config.swfDomain,
  namespace = config.namespace,
  signalName,
  workflowId,
  prefixWorkflowId = true,
}) {
  const SWF = new config.AWS.SWF()

  const params = {
    domain,
    signalName,
    workflowId: prefixWorkflowId
      ? [namespace, workflowId].filter(v => v).join('_')
      : workflowId,
    input: JSON.stringify(input),
  }
  return await SWF.signalWorkflowExecution(params).promise()
}
