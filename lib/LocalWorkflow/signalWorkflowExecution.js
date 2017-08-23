import {get} from './StoreContext'

async function signalWorkflowExecution({
  workflowId = 'none-provided',
  signalName,
  input,
}) {
  const context = get(workflowId)
  if (!Array.isArray(context.soflow.receivedSignals[signalName])) {
    context.soflow.receivedSignals[signalName] = []
  }
  context.soflow.receivedSignals[signalName].push(JSON.parse(input))
}

export default signalWorkflowExecution
