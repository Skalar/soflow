const parseJSONWithFallback = require('./helpers/parseJSONWithFallback')

function outgoingSignals(state = {}, events = []) {
  for (const event of events) {
    switch (event.eventType) {
      case 'SignalExternalWorkflowExecutionInitiated': {
        const {
          control,
          // decisionTaskCompletedEventId,
          runId,
          signalName,
          input,
          workflowId,
        } = event.signalExternalWorkflowExecutionInitiatedEventAttributes

        const signalKey = [workflowId, runId, signalName, control].join('_')

        state[signalKey] = {
          initiatedAt: event.eventTimestamp,
          initiatedEventId: event.eventId,
          status: 'initiated',
          input: parseJSONWithFallback(input),
          runId,
          workflowId,
        }
        break
      }

      case 'SignalExternalWorkflowExecutionFailed': {
        const {
          cause,
          initiatedEventId,
          // control,
          // decisionTaskCompletedEventId,
          // runId,
          // workflowId,
        } = event.signalExternalWorkflowExecutionFailedEventAttributes

        const signal = Object.values(state).find(
          signal => signal.initiatedEventId === initiatedEventId
        )

        Object.assign(signal, {
          status: 'failed',
          failedAt: event.eventTimestamp,
          cause,
        })

        break
      }

      case 'ExternalWorkflowExecutionSignaled': {
        const {
          initiatedEventId,
          workflowExecution: {runId},
        } = event.externalWorkflowExecutionSignaledEventAttributes

        const signal = Object.values(state).find(
          signal => signal.initiatedEventId === initiatedEventId
        )

        Object.assign(signal, {
          status: 'sent',
          runId,
          sentAt: event.eventTimestamp,
        })
      }
    }
  }

  return state
}

module.exports = outgoingSignals
