const parseJSONWithFallback = require('./helpers/parseJSONWithFallback')

function timers(timers = {}, events = []) {
  for (const event of events) {
    switch (event.eventType) {
      case 'StartTimerFailed': {
        const {timerId, cause} = event.startTimerFailedEventAttributes

        timers[timerId] = {
          cause,
          status: 'startFailed',
        }

        break
      }

      case 'TimerStarted': {
        const {
          timerId,
          control,
          // decisionTaskCompletedEventId,
        } = event.timerStartedEventAttributes

        timers[timerId] = {
          data: parseJSONWithFallback(control),
          status: 'started',
        }

        break
      }

      case 'CancelTimerFailed': {
        const {
          timerId,
          cause,
          // decisionTaskCompletedEventId,
        } = event.cancelTimerFailedEventAttributes

        const timer = timers[timerId]
        timer.status = 'cancelFailed'
        timer.cause = cause
        break
      }

      case 'TimerCanceled': {
        const {
          timerId,
          // startedEventId,
          // decisionTaskCompletedEventId,
        } = event.timerCanceledEventAttributes

        timers[timerId].status = 'canceled'
        break
      }

      case 'TimerFired': {
        const {
          timerId,
          // startedEventId,
        } = event.timerFiredEventAttributes

        timers[timerId].status = 'fired'
        break
      }
    }
  }

  return timers
}

module.exports = timers
