import test from 'blue-tape'
import LambdaFunction from './LambdaFunction'

const events = {
  scheduled: {
    eventId: 1,
    eventType: 'LambdaFunctionScheduled',
    lambdaFunctionScheduledEventAttributes: {
      id: 'myLambdaFunction',
      name: 'myLambdaFunction',
      input: '2',
      startToCloseTimeout: '60',
      decisionTaskCompletedEventId: 0
    }
  },
  scheduleFailed: {
    eventId: 2,
    eventType: 'ScheduleLambdaFunctionFailed',
    scheduleLambdaFunctionFailedEventAttributes: {
      id: 'myLambdaFunction',
      name: 'myLambdaFunction',
      cause: 'ID_ALREADY_IN_USE',
      decisionTaskCompletedEventId: 0
    }
  },
  started: {
    eventId: 2,
    eventType: 'LambdaFunctionStarted',
    lambdaFunctionStartedEventAttributes: {
      scheduledEventId: 1,
    }
  },
  startFailed: {
    eventId: 2,
    eventType: 'StartLambdaFunctionFailed',
    startLambdaFunctionFailedEventAttributes: {
      scheduledEventId: 1,
      cause: 'ASSUME_ROLE_FAILED',
      message: 'error',
    }
  },
  timedOut: {
    eventId: 2,
    eventType: 'LambdaFunctionTimedOut',
    lambdaFunctionTimedOutEventAttributes: {
      scheduledEventId: 1,
      startedEventId: 2,
      timeoutType: 'START_TO_CLOSE'
    }
  },
  failed: {
    eventId: 3,
    eventType: 'LambdaFunctionFailed',
    lambdaFunctionFailedEventAttributes: {
      scheduledEventId: 1,
      startedEventId: 2,
      reason: 'HandledError',
      details: JSON.stringify({
        errorType: 'UserUnreachable',
        errorMessage: 'Cannot reach user on any device',
        stackTrace: [],
      }),
    }
  },
  completed: {
    eventId: 3,
    eventType: 'LambdaFunctionCompleted',
    lambdaFunctionCompletedEventAttributes: {
      scheduledEventId: 1,
      startedEventId: 2,
      result: 'true',
    }
  },
}

test('SWF.WorkflowHistory.LambdaFunction', {timeout: 1000}, async t => {
  t.deepEqual(
    LambdaFunction([
      events.scheduled
    ]).myLambdaFunction,
    {
      input: '2',
      state: {name: 'scheduled'},
    },
    'scheduled function'
  )

  t.deepEqual(
    LambdaFunction([
      events.scheduled,
      events.started
    ]).myLambdaFunction,
    {
      input: '2',
      state: {name: 'started'},
    },
    'started function'
  )

  t.deepEqual(
    LambdaFunction([
      events.scheduled,
      events.started,
      events.completed,
    ]).myLambdaFunction,
    {
      input: '2',
      state: {name: 'completed', result: 'true'},
    },
    'completed function'
  )

  t.deepEqual(
    LambdaFunction([
      events.scheduled,
      events.scheduleFailed,
    ]).myLambdaFunction,
    {
      input: '2',
      state: {name: 'scheduleFailed', cause: 'ID_ALREADY_IN_USE'},
    },
    'failure to schedule function'
  )

  t.deepEqual(
    LambdaFunction([
      events.scheduled,
      events.startFailed,
    ]).myLambdaFunction,
    {
      input: '2',
      state: {name: 'startFailed', cause: 'ASSUME_ROLE_FAILED', message: 'error'},
    },
    'failure to start function'
  )

  t.deepEqual(
    LambdaFunction([
      events.scheduled,
      events.started,
      events.timedOut,
    ]).myLambdaFunction,
    {
      input: '2',
      state: {name: 'timedOut', timeoutType: 'START_TO_CLOSE'},
    },
    'function timeout'
  )

  t.deepEqual(
    LambdaFunction([
      events.scheduled,
      events.started,
      events.failed,
    ]).myLambdaFunction,
    {
      input: '2',
      state: {
        name: 'failed',
        errorType: 'UserUnreachable',
        errorMessage: 'Cannot reach user on any device',
        stackTrace: [],
      },
    },
    'failed function'
  )
})
