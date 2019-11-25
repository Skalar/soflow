const parseJSONWithFallback = require('./helpers/parseJSONWithFallback')

function lambdaFunctions(state = {}, events = []) {
  for (const event of events) {
    switch (event.eventType) {
      case 'ScheduleLambdaFunctionFailed': {
        const {
          id,
          // name,
          cause,
          // decisionTaskCompletedEventId,
        } = event.scheduleLambdaFunctionFailedEventAttributes

        state[id] = {status: 'scheduleFailed', cause}

        break
      }

      case 'LambdaFunctionScheduled': {
        const {
          id,
          input,
          // name,
          startToCloseTimeout,
          // decisionTaskCompletedEventId,
        } = event.lambdaFunctionScheduledEventAttributes

        state[id] = {
          input: parseJSONWithFallback(input),
          status: 'scheduled',
          scheduledEventId: event.eventId,
          startToCloseTimeout: parseInt(startToCloseTimeout, 10),
        }

        break
      }

      case 'StartLambdaFunctionFailed': {
        const {
          scheduledEventId,
          cause,
          message,
        } = event.startLambdaFunctionFailedEventAttributes

        const lambdaFunction = Object.values(state).find(
          lambdaFunction => lambdaFunction.scheduledEventId === scheduledEventId
        )

        Object.assign(lambdaFunction, {status: 'startFailed', cause, message})
        break
      }

      case 'LambdaFunctionStarted': {
        const {scheduledEventId} = event.lambdaFunctionStartedEventAttributes
        const lambdaFunction = Object.values(state).find(
          lambdaFunction => lambdaFunction.scheduledEventId === scheduledEventId
        )

        Object.assign(lambdaFunction, {status: 'started'})

        break
      }

      case 'LambdaFunctionFailed': {
        const {
          scheduledEventId,
          // startedEventId,
          // reason,
          details,
        } = event.lambdaFunctionFailedEventAttributes

        const lambdaFunction = Object.values(state).find(
          lambdaFunction => lambdaFunction.scheduledEventId === scheduledEventId
        )
        const {
          errorType: name = 'Error',
          errorMessage: message = '',
          trace = []
        } = parseJSONWithFallback(details)
        Object.assign(lambdaFunction, {
          status: 'failed',
          failedAt: event.eventTimestamp,
          error: {name, message, stack: trace.join('\n')},
        })

        break
      }

      case 'LambdaFunctionTimedOut': {
        const {
          scheduledEventId,
          // startedEventId,
          timeoutType,
        } = event.lambdaFunctionTimedOutEventAttributes

        const lambdaFunction = Object.values(state).find(
          lambdaFunction => lambdaFunction.scheduledEventId === scheduledEventId
        )
        Object.assign(lambdaFunction, {
          status: 'timedOut',
          timedOutAt: event.eventTimestamp,
          timeoutType,
        })

        break
      }

      case 'LambdaFunctionCompleted': {
        const {
          scheduledEventId,
          // startedEventId,
          result,
        } = event.lambdaFunctionCompletedEventAttributes

        const lambdaFunction = Object.values(state).find(
          lambdaFunction => lambdaFunction.scheduledEventId === scheduledEventId
        )
        Object.assign(lambdaFunction, {
          status: 'completed',
          completedAt: event.eventTimestamp,
          result: parseJSONWithFallback(result),
        })

        break
      }

      default: {
        break
      }
    }
  }

  return state
}

module.exports = lambdaFunctions
