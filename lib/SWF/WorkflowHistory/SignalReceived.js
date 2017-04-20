function SignalReceived(workflowEvents) {
  const instances = {}

  for (const event of workflowEvents) {
    switch (event.eventType) {

      case 'WorkflowExecutionSignaled': {
        const {
          signalName,
          input,
        } = event.workflowExecutionSignaledEventAttributes

        instances[signalName] = {
          input,
          state: {name: 'received', input}
        }

        break
      }

      default: {
        break
      }
    }
  }

  return instances
}

export default SignalReceived
