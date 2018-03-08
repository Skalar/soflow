const test = require('ava')
const timers = require('./timers')

test('no timers', async t => {
  const state = timers()

  t.deepEqual(
    state,
    {},
    'returns an empty object when no state and events provided'
  )
})

test('start failed', async t => {
  const state = timers(undefined, [
    {
      eventId: 1,
      eventType: 'StartTimerFailed',
      startTimerFailedEventAttributes: {
        timerId: 'testTimer',
        cause: 'TIMER_ID_ALREADY_IN_USE',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testTimer: {
        status: 'startFailed',
        cause: 'TIMER_ID_ALREADY_IN_USE',
      },
    },
    'failed to start'
  )
})

test('started', async t => {
  const state = timers(undefined, [
    {
      eventId: 1,
      eventType: 'TimerStarted',
      timerStartedEventAttributes: {
        timerId: 'testTimer',
        control: JSON.stringify({my: 'data'}),
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testTimer: {
        status: 'started',
        data: {my: 'data'},
      },
    },
    'started'
  )
})

test('cancel failed', async t => {
  const state = timers(undefined, [
    {
      eventId: 1,
      eventType: 'TimerStarted',
      timerStartedEventAttributes: {
        timerId: 'testTimer',
        control: JSON.stringify({my: 'data'}),
      },
    },
    {
      eventId: 2,
      eventType: 'CancelTimerFailed',
      cancelTimerFailedEventAttributes: {
        timerId: 'testTimer',
        cause: 'OPERATION_NOT_PERMITTED',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testTimer: {
        data: {my: 'data'},
        status: 'cancelFailed',
        cause: 'OPERATION_NOT_PERMITTED',
      },
    },
    'failed to cancel'
  )
})

test('canceled', async t => {
  const state = timers(undefined, [
    {
      eventId: 1,
      eventType: 'TimerStarted',
      timerStartedEventAttributes: {
        timerId: 'testTimer',
        control: JSON.stringify({my: 'data'}),
      },
    },
    {
      eventId: 2,
      eventType: 'TimerCanceled',
      timerCanceledEventAttributes: {
        timerId: 'testTimer',
        startedEventId: 1,
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testTimer: {
        data: {my: 'data'},
        status: 'canceled',
      },
    },
    'was canceled'
  )
})

test('fired', async t => {
  const state = timers(undefined, [
    {
      eventId: 1,
      eventType: 'TimerStarted',
      timerStartedEventAttributes: {
        timerId: 'testTimer',
        control: JSON.stringify({my: 'data'}),
      },
    },
    {
      eventId: 2,
      eventType: 'TimerFired',
      timerFiredEventAttributes: {
        timerId: 'testTimer',
        startedEventId: 1,
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testTimer: {
        data: {my: 'data'},
        status: 'fired',
      },
    },
    'fired'
  )
})
