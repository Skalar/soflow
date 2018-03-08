const test = require('ava')

const activityTasks = require('./activityTasks')

test('not scheduled', async t => {
  const state = activityTasks()

  t.deepEqual(
    state,
    {},
    'returns an empty object when no state and events provided'
  )
})

test('schedule failed', async t => {
  const state = activityTasks(undefined, [
    {
      eventId: 1,
      eventType: 'ScheduleActivityTaskFailed',
      scheduleActivityTaskFailedEventAttributes: {
        activityId: 'testActivity',
        cause: 'something',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testActivity: {
        status: 'scheduleFailed',
        cause: 'something',
      },
    },
    'failed to be scheduled'
  )
})

test('scheduled', async t => {
  const state = activityTasks(undefined, [
    {
      eventId: 1,
      eventType: 'ActivityTaskScheduled',
      eventTimestamp: new Date('2018-01-01 10:00'),
      activityTaskScheduledEventAttributes: {
        name: 'doSomething',
        activityId: 'testActivity',
        startToCloseTimeout: '60',
        input: JSON.stringify(['arg1', 'arg2']),
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testActivity: {
        name: 'doSomething',
        input: ['arg1', 'arg2'],
        scheduledEventId: 1,
        scheduledAt: new Date('2018-01-01 10:00'),
        status: 'scheduled',
        startToCloseTimeout: 60,
      },
    },
    'scheduled activity'
  )
})

test('failed to start', async t => {
  const state = activityTasks(undefined, [
    {
      eventId: 1,
      eventType: 'ActivityTaskScheduled',
      eventTimestamp: new Date('2018-01-01 10:00'),
      activityTaskScheduledEventAttributes: {
        name: 'doSomething',
        activityId: 'testActivity',
        startToCloseTimeout: '60',
        input: JSON.stringify(['arg1', 'arg2']),
      },
    },
    {
      eventId: 2,
      eventType: 'StartActivityTaskFailed',
      startActivityTaskFailedEventAttributes: {
        scheduledEventId: 1,
        cause: 'some cause',
        message: 'some message',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testActivity: {
        name: 'doSomething',
        scheduledEventId: 1,
        scheduledAt: new Date('2018-01-01 10:00'),
        startToCloseTimeout: 60,
        input: ['arg1', 'arg2'],
        status: 'startFailed',
        cause: 'some cause',
        message: 'some message',
      },
    },
    'failed to start'
  )
})

test('started', async t => {
  const state = activityTasks(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01 10:00'),
      eventType: 'ActivityTaskScheduled',
      activityTaskScheduledEventAttributes: {
        name: 'doSomething',
        activityId: 'testActivity',
        startToCloseTimeout: '60',
        input: JSON.stringify(['arg1', 'arg2']),
      },
    },
    {
      eventId: 2,
      eventTimestamp: new Date('2018-01-01 10:01'),
      eventType: 'ActivityTaskStarted',
      activityTaskStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testActivity: {
        name: 'doSomething',
        scheduledEventId: 1,
        scheduledAt: new Date('2018-01-01 10:00'),
        startedAt: new Date('2018-01-01 10:01'),
        startToCloseTimeout: 60,
        input: ['arg1', 'arg2'],
        status: 'started',
      },
    },
    'has started'
  )
})

test('failed', async t => {
  const state = activityTasks(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01 10:00'),
      eventType: 'ActivityTaskScheduled',
      activityTaskScheduledEventAttributes: {
        name: 'doSomething',
        activityId: 'testActivity',
        startToCloseTimeout: '60',
        input: JSON.stringify(['arg1', 'arg2']),
      },
    },
    {
      eventId: 2,
      eventTimestamp: new Date('2018-01-01 10:01'),
      eventType: 'ActivityTaskStarted',
      activityTaskStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
    {
      eventId: 3,
      eventTimestamp: new Date('2018-01-01 10:02'),
      eventType: 'ActivityTaskFailed',
      activityTaskFailedEventAttributes: {
        scheduledEventId: 1,
        startedEventId: 2,
        reason: 'some reason',
        details: JSON.stringify({
          name: 'Error',
          message: 'test error',
          stack: '...',
        }),
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testActivity: {
        name: 'doSomething',
        scheduledEventId: 1,
        scheduledAt: new Date('2018-01-01 10:00'),
        startedAt: new Date('2018-01-01 10:01'),
        failedAt: new Date('2018-01-01 10:02'),
        status: 'failed',
        startToCloseTimeout: 60,
        input: ['arg1', 'arg2'],
        error: {
          name: 'Error',
          message: 'test error',
          stack: '...',
        },
      },
    },
    'failed'
  )
})

test('timed out', async t => {
  const state = activityTasks(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01 10:00'),
      eventType: 'ActivityTaskScheduled',
      activityTaskScheduledEventAttributes: {
        name: 'doSomething',
        activityId: 'testActivity',
        startToCloseTimeout: '60',
        input: JSON.stringify(['arg1', 'arg2']),
      },
    },
    {
      eventId: 2,
      eventTimestamp: new Date('2018-01-01 10:01'),
      eventType: 'ActivityTaskStarted',
      activityTaskStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
    {
      eventId: 3,
      eventTimestamp: new Date('2018-01-01 10:02'),
      eventType: 'ActivityTaskTimedOut',
      activityTaskTimedOutEventAttributes: {
        scheduledEventId: 1,
        startedEventId: 2,
        timeoutType: 'START_TO_CLOSE',
        details: 'some details',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testActivity: {
        name: 'doSomething',
        scheduledEventId: 1,
        scheduledAt: new Date('2018-01-01 10:00'),
        startedAt: new Date('2018-01-01 10:01'),
        timedOutAt: new Date('2018-01-01 10:02'),
        startToCloseTimeout: 60,
        input: ['arg1', 'arg2'],
        status: 'timedOut',
        details: 'some details',
        timeoutType: 'START_TO_CLOSE',
      },
    },
    'timed out'
  )
})

test('completed', async t => {
  const state = activityTasks(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01 10:00'),
      eventType: 'ActivityTaskScheduled',
      activityTaskScheduledEventAttributes: {
        name: 'doSomething',
        activityId: 'testActivity',
        startToCloseTimeout: '60',
        input: JSON.stringify(['arg1', 'arg2']),
      },
    },
    {
      eventId: 2,
      eventTimestamp: new Date('2018-01-01 10:01'),
      eventType: 'ActivityTaskStarted',
      activityTaskStartedEventAttributes: {
        scheduledEventId: 1,
      },
    },
    {
      eventId: 3,
      eventTimestamp: new Date('2018-01-01 10:02'),
      eventType: 'ActivityTaskCompleted',
      activityTaskCompletedEventAttributes: {
        scheduledEventId: 1,
        startedEventId: 2,
        result: JSON.stringify('the result'),
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testActivity: {
        name: 'doSomething',
        scheduledEventId: 1,
        startToCloseTimeout: 60,
        scheduledAt: new Date('2018-01-01 10:00'),
        startedAt: new Date('2018-01-01 10:01'),
        completedAt: new Date('2018-01-01 10:02'),
        input: ['arg1', 'arg2'],
        status: 'completed',
        result: 'the result',
      },
    },
    'completed'
  )
})
