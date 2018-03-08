const parseJSONWithFallback = require('./helpers/parseJSONWithFallback')

function childWorkflows(state = {}, events = []) {
  for (const event of events) {
    switch (event.eventType) {
      case 'StartChildWorkflowExecutionFailed': {
        const {
          cause,
          control,
          // decisionTaskCompletedEventId,
          // initiatedEventId,
          workflowId,
          // workflowType: {name: workflowTypeName},
        } = event.startChildWorkflowExecutionFailedEventAttributes

        state[workflowId] = {
          status: 'startFailed',
          cause,
          control,
        }

        break
      }

      case 'StartChildWorkflowExecutionInitiated': {
        const {
          workflowId,
          // workflowType: {name: workflowTypeName},
        } = event.startChildWorkflowExecutionInitiatedEventAttributes

        state[workflowId] = {
          status: 'initiated',
        }

        break
      }

      case 'ChildWorkflowExecutionStarted': {
        const {
          workflowExecution: {workflowId},
          // initiatedEventId,
          // workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionStartedEventAttributes

        Object.assign(state[workflowId], {
          status: 'started',
        })

        break
      }

      case 'ChildWorkflowExecutionCanceled': {
        const {
          details,
          // initiatedEventId,
          // startedEventId,
          workflowExecution: {workflowId},
          // workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionCanceledEventAttributes

        Object.assign(state[workflowId], {
          status: 'canceled',
          details: parseJSONWithFallback(details),
        })

        break
      }

      case 'ChildWorkflowExecutionTimedOut': {
        const {
          // initiatedEventId,
          // startedEventId,
          timeoutType,
          workflowExecution: {workflowId},
          // workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionTimedOutEventAttributes

        Object.assign(state[workflowId], {
          status: 'timedOut',
          timeoutType,
        })

        break
      }

      case 'ChildWorkflowExecutionTerminated': {
        const {
          // initiatedEventId,
          // startedEventId,
          workflowExecution: {workflowId},
          // workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionTerminatedEventAttributes

        Object.assign(state[workflowId], {
          status: 'terminated',
        })

        break
      }

      case 'ChildWorkflowExecutionFailed': {
        const {
          // initiatedEventId,
          details,
          reason,
          // startedEventId,
          workflowExecution: {workflowId},
          // workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionFailedEventAttributes

        Object.assign(state[workflowId], {
          status: 'failed',
          details: parseJSONWithFallback(details),
          reason,
        })

        break
      }

      case 'ChildWorkflowExecutionCompleted': {
        const {
          // initiatedEventId,
          result,
          // startedEventId,
          workflowExecution: {workflowId},
          // workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionCompletedEventAttributes

        Object.assign(state[workflowId], {
          status: 'completed',
          result: parseJSONWithFallback(result),
        })

        break
      }
    }
  }

  return state
}

module.exports = childWorkflows
