const parseJSONWithFallback = require('./helpers/parseJSONWithFallback')

function incomingSignals(state = {}, events = []) {
  for (const event of events) {
    switch (event.eventType) {
      case 'WorkflowExecutionSignaled': {
        const {
          signalName,
          input,
        } = event.workflowExecutionSignaledEventAttributes

        if (!state[signalName]) {
          state[signalName] = []
        }

        state[signalName].push({
          receivedAt: event.eventTimestamp,
          input: parseJSONWithFallback(input),
        })
      }
    }
  }

  return state
}

module.exports = incomingSignals
