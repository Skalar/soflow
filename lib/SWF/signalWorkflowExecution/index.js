import AWS from 'aws-sdk'
const SWF = new AWS.SWF({region: 'eu-west-1'})

export default function signalWorkflowExecution({
  input,
  domain,
  signalName,
  workflowId,
}) {
  const params = {
    domain,
    signalName,
    workflowId,
    input: JSON.stringify(input),
  }
  return SWF.signalWorkflowExecution(params).promise()
}
