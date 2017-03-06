import test from 'blue-tape'
import Timer from './Timer'

const events = {
  started: {
    eventId: 1,
    eventType: 'TimerStarted',
    timerStartedEventAttributes: {
      timerId: 'myTimer',
      control: 'controlValue',
      startToFireTimeout: '2',
      decisionTaskCompletedEventId: 0
    }
  },
  startFailed: {
    eventId: 1,
    eventType: 'StartTimerFailed',
    startTimerFailedEventAttributes: {
      timerId: 'myTimer',
      cause: 'TIMER_ID_ALREADY_IN_USE',
      decisionTaskCompletedEventId: 0
    }
  },
  fired: {
    eventId: 2,
    eventType: 'TimerFired',
    timerFiredEventAttributes: {
      timerId: 'myTimer',
      startEventId: 1,
    }
  },
  canceled: {
    eventId: 2,
    eventType: 'TimerCanceled',
    timerCanceledEventAttributes: {
      timerId: 'myTimer',
      startEventId: 1,
      decisionTaskCompletedEventId: 0
    }
  },
  cancelFailed: {
    eventId: 2,
    eventType: 'CancelTimerFailed',
    cancelTimerFailedEventAttributes: {
      timerId: 'myTimer',
      cause: 'TIMER_ID_UNKNOWN',
      decisionTaskCompletedEventId: 0
    }
  },
}

test('SWF.WorkflowHistory.Timer', {timeout: 1000}, async t => {
  t.deepEqual(
    Timer([
      events.started
    ]).myTimer,
    {
      state: {
        name: 'started'
      },
      control: 'controlValue'
    },
    'started timer'
  )

  t.deepEqual(
    Timer([
      events.startFailed
    ]).myTimer,
    {
      state: {
        name: 'startFailed',
        cause: 'TIMER_ID_ALREADY_IN_USE',
      },
    },
    'timer failing to start'
  )

  t.deepEqual(
    Timer([
      events.started,
      events.fired,
    ]).myTimer,
    {
      state: {
        name: 'fired',
      },
      control: 'controlValue'
    },
    'fired timer'
  )

  t.deepEqual(
    Timer([
      events.started,
      events.canceled,
    ]).myTimer,
    {
      state: {
        name: 'canceled',
      },
      control: 'controlValue'
    },
    'canceled timer'
  )

  t.deepEqual(
    Timer([
      events.started,
      events.cancelFailed,
    ]).myTimer,
    {
      state: {
        name: 'cancelFailed',
        cause: 'TIMER_ID_UNKNOWN',
      },
      control: 'controlValue'
    },
    'failed timer cancelation'
  )
})
