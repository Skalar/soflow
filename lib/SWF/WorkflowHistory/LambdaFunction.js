function LambdaFunction(workflowEvents) {
  const instances = {}
  const scheduledEventIdToTaskId = {}

  for (const event of workflowEvents) {
    switch (event.eventType) {
      case 'LambdaFunctionScheduled': {
        const {
          id,
          input,
          // name,
          // startToCloseTimeout,
          // decisionTaskCompletedEventId,
        } = event.lambdaFunctionScheduledEventAttributes

        instances[id] = {
          input,
          state: {name: 'scheduled'},
        }

        scheduledEventIdToTaskId[event.eventId] = id
        break
      }

      case 'LambdaFunctionStarted': {
        const {
          scheduledEventId,
        } = event.lambdaFunctionStartedEventAttributes
        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'started'}

        break
      }

      case 'LambdaFunctionCompleted': {
        const {
          scheduledEventId,
          // startedEventId,
          result,
        } = event.lambdaFunctionCompletedEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'completed', result}

        break
      }

      case 'LambdaFunctionFailed': {
        const {
          scheduledEventId,
          // startedEventId,
          // reason,
          details: detailsJSON,
        } = event.lambdaFunctionFailedEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        const details = JSON.parse(detailsJSON)

        instance.state = {name: 'failed', ...details}

        break
      }

      case 'LambdaFunctionTimedOut': {
        const {
          scheduledEventId,
          // startedEventId,
          timeoutType,
        } = event.lambdaFunctionTimedOutEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'timedOut', timeoutType}

        break
      }

      case 'ScheduleLambdaFunctionFailed': {
        const {
          id,
          // name,
          cause,
          // decisionTaskCompletedEventId,
        } = event.scheduleLambdaFunctionFailedEventAttributes

        const instance = instances[id]

        instance.state = {name: 'scheduleFailed', cause}
        break
      }

      case 'StartLambdaFunctionFailed': {
        const {
          scheduledEventId,
          cause,
          message,
        } = event.startLambdaFunctionFailedEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'startFailed', cause, message}
        break
      }

      default: {
        break
      }
    }
  }

  return instances
}


export default LambdaFunction
