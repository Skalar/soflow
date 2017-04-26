function SignalReceived(workflowEvents) {
  const instances = {}

  for (const event of workflowEvents) {
    switch (event.eventType) {

      case 'WorkflowExecutionSignaled': {
        const {
          signalName,
          input,
        } = event.workflowExecutionSignaledEventAttributes

        // Create an instance if it does not already exist
        if (!instances[signalName]) {
          instances[signalName] = {
            inputList: [],
            state: {
              name: 'received',
              receivedCount: 0,
            }
          }
        }
        // To support receiving the same signal multiple times, we need to store
        // the list of input data in the order each input is received
        instances[signalName].inputList.push(input)
        instances[signalName].state.receivedCount += 1

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
