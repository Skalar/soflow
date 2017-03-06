function Timer(workflowEvents) {
  const instances = {}
  const startEventIdToTimerId = {}

  for (const event of workflowEvents) {
    switch (event.eventType) {
      case 'TimerStarted': {
        const {
          timerId,
          control,
          // decisionTaskCompletedEventId,
        } = event.timerStartedEventAttributes

        instances[timerId] = {
          control,
          state: {name: 'started'},
        }

        startEventIdToTimerId[event.eventId] = timerId
        break
      }

      case 'StartTimerFailed': {
        const {
          timerId,
          cause,
        } = event.startTimerFailedEventAttributes

        instances[timerId] = {
          state: {
            cause,
            name: 'startFailed',
          },
        }

        break
      }

      case 'TimerFired': {
        const {
          timerId,
          // startedEventId,
        } = event.timerFiredEventAttributes

        const instance = instances[timerId]

        instance.state = {name: 'fired'}
        break
      }

      case 'TimerCanceled': {
        const {
          timerId,
          // startedEventId,
          // decisionTaskCompletedEventId,
        } = event.timerCanceledEventAttributes

        const instance = instances[timerId]

        instance.state = {name: 'canceled'}
        break
      }

      case 'CancelTimerFailed': {
        const {
          timerId,
          cause,
          // decisionTaskCompletedEventId,
        } = event.cancelTimerFailedEventAttributes

        const instance = instances[timerId]

        instance.state = {name: 'cancelFailed', cause}
        break
      }
    }
  }

  return instances
}


export default Timer
