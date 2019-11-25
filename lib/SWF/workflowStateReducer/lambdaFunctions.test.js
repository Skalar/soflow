const test = require('ava')
const lambdaFunctions = require('./lambdaFunctions')

test('not scheduled', async t => {
  const state = lambdaFunctions()

  t.deepEqual(
    state,
    {},
    'returns an empty object when no state and events provided'
  )
})

test('schedule failed', async t => {
  const state = lambdaFunctions(undefined, [
    {
      eventId: 1,
      eventType: 'ScheduleLambdaFunctionFailed',
      scheduleLambdaFunctionFailedEventAttributes: {
        id: 'test',
        name: 'doSomething',
        cause: 'ID_ALREADY_IN_USE',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      test: {
        status: 'scheduleFailed',
        cause: 'ID_ALREADY_IN_USE',
      },
    },
    'ScheduleLambdaFunctionFailed'
  )
})

test('scheduled', async t => {
  const state = lambdaFunctions(undefined, [
    {
      eventId: 1,
      eventType: 'LambdaFunctionScheduled',
      lambdaFunctionScheduledEventAttributes: {
        id: 'test',
        input: JSON.stringify({my: 'data'}),
        name: 'doSomething',
        startToCloseTimeout: '20',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      test: {
        input: {my: 'data'},
        status: 'scheduled',
        scheduledEventId: 1,
        startToCloseTimeout: 20,
      },
    },
    'LambdaFunctionScheduled'
  )
})

test('start failed', async t => {
  const state = lambdaFunctions(undefined, [
    {
      eventId: 1,
      eventType: 'LambdaFunctionScheduled',
      lambdaFunctionScheduledEventAttributes: {
        id: 'test',
        input: JSON.stringify({my: 'data'}),
        name: 'doSomething',
        startToCloseTimeout: '20',
      },
    },
    {
      eventId: 2,
      eventType: 'StartLambdaFunctionFailed',
      startLambdaFunctionFailedEventAttributes: {
        scheduledEventId: 1,
        cause: 'OPERATION_NOT_PERMITTED',
        message: 'Some message',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      test: {
        input: {my: 'data'},
        status: 'startFailed',
        scheduledEventId: 1,
        startToCloseTimeout: 20,
        cause: 'OPERATION_NOT_PERMITTED',
        message: 'Some message',
      },
    },
    'StartLambdaFunctionFailed'
  )
})

test('started', async t => {
  const state = lambdaFunctions(undefined, [
    {
      eventId: 1,
      eventType: 'LambdaFunctionScheduled',
      lambdaFunctionScheduledEventAttributes: {
        id: 'test',
        input: JSON.stringify({my: 'data'}),
        name: 'doSomething',
        startToCloseTimeout: '20',
      },
    },
    {
      eventId: 2,
      eventType: 'LambdaFunctionStarted',
      lambdaFunctionStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
  ])

  t.deepEqual(
    state,
    {
      test: {
        input: {my: 'data'},
        status: 'started',
        scheduledEventId: 1,
        startToCloseTimeout: 20,
      },
    },
    'LambdaFunctionStarted'
  )
})

test('failed', async t => {
  const state = lambdaFunctions(undefined, [
    {
      eventId: 1,
      eventType: 'LambdaFunctionScheduled',
      lambdaFunctionScheduledEventAttributes: {
        id: 'test',
        input: JSON.stringify({my: 'data'}),
        name: 'doSomething',
        startToCloseTimeout: '20',
      },
    },
    {
      eventId: 2,
      eventType: 'LambdaFunctionStarted',
      lambdaFunctionStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
    {
      eventId: 3,
      eventType: 'LambdaFunctionFailed',
      eventTimestamp: new Date('2018-01-01 10:02'),
      lambdaFunctionFailedEventAttributes: {
        scheduledEventId: 1,
        reason: 'Error',
        details: JSON.stringify({
          errorType: 'Error',
          errorMessage: 'test error',
          trace: ['...'],
        }),
      },
    },
  ])

  t.deepEqual(
    state,
    {
      test: {
        input: {my: 'data'},
        status: 'failed',
        failedAt: new Date('2018-01-01 10:02'),
        scheduledEventId: 1,
        startToCloseTimeout: 20,
        error: {
          name: 'Error',
          message: 'test error',
          stack: '...',
        },
      },
    },
    'LambdaFunctionFailed'
  )
})

test('timed out', async t => {
  const state = lambdaFunctions(undefined, [
    {
      eventId: 1,
      eventType: 'LambdaFunctionScheduled',
      lambdaFunctionScheduledEventAttributes: {
        id: 'test',
        input: JSON.stringify({my: 'data'}),
        name: 'doSomething',
        startToCloseTimeout: '20',
      },
    },
    {
      eventId: 2,
      eventType: 'LambdaFunctionStarted',
      lambdaFunctionStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
    {
      eventId: 3,
      eventType: 'LambdaFunctionTimedOut',
      eventTimestamp: new Date('2018-01-01 10:02'),
      lambdaFunctionTimedOutEventAttributes: {
        scheduledEventId: 1,
        timeoutType: 'START_TO_CLOSE',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      test: {
        input: {my: 'data'},
        status: 'timedOut',
        startToCloseTimeout: 20,
        timedOutAt: new Date('2018-01-01 10:02'),
        scheduledEventId: 1,
        timeoutType: 'START_TO_CLOSE',
      },
    },
    'LambdaFunctionTimedOut'
  )
})

test('completed', async t => {
  const state = lambdaFunctions(undefined, [
    {
      eventId: 1,
      eventType: 'LambdaFunctionScheduled',
      lambdaFunctionScheduledEventAttributes: {
        id: 'test',
        input: JSON.stringify({my: 'data'}),
        name: 'doSomething',
        startToCloseTimeout: '20',
      },
    },
    {
      eventId: 2,
      eventType: 'LambdaFunctionStarted',
      lambdaFunctionStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
    {
      eventId: 3,
      eventType: 'LambdaFunctionCompleted',
      eventTimestamp: new Date('2018-01-01 10:02'),
      lambdaFunctionCompletedEventAttributes: {
        scheduledEventId: 1,
        result: {my: 'result'},
      },
    },
  ])

  t.deepEqual(
    state,
    {
      test: {
        input: {my: 'data'},
        status: 'completed',
        startToCloseTimeout: 20,
        completedAt: new Date('2018-01-01 10:02'),
        scheduledEventId: 1,
        result: {my: 'result'},
      },
    },
    'LambdaFunctionCompleted'
  )
})
