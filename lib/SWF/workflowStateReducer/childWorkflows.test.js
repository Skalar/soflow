const test = require('ava')
const childWorkflows = require('./childWorkflows')

test('not scheduled', async t => {
  const state = childWorkflows()

  t.deepEqual(
    state,
    {},
    'returns an empty object when no state and events provided'
  )
})

test('failed to start', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionFailed',
      startChildWorkflowExecutionFailedEventAttributes: {
        cause: 'WORKFLOW_ALREADY_RUNNING',
        control: 'test',
        workflowId: 'testWorkflowId',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'startFailed',
        cause: 'WORKFLOW_ALREADY_RUNNING',
        control: 'test',
      },
    },
    'failed to start'
  )
})

test('initiated', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionInitiated',
      startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'testWorkflowId',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'initiated',
      },
    },
    'initiated'
  )
})

test('started', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionInitiated',
      startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'testWorkflowId',
      },
    },
    {
      eventId: 2,
      eventType: 'ChildWorkflowExecutionStarted',
      childWorkflowExecutionStartedEventAttributes: {
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'started',
      },
    },
    'started'
  )
})

test('canceled', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionInitiated',
      startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'testWorkflowId',
      },
    },
    {
      eventId: 2,
      eventType: 'ChildWorkflowExecutionStarted',
      childWorkflowExecutionStartedEventAttributes: {
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
    {
      eventId: 3,
      eventType: 'ChildWorkflowExecutionCanceled',
      childWorkflowExecutionCanceledEventAttributes: {
        details: JSON.stringify({my: 'data'}),
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'canceled',
        details: {my: 'data'},
      },
    },
    'canceled'
  )
})

test('timed out', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionInitiated',
      startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'testWorkflowId',
      },
    },
    {
      eventId: 2,
      eventType: 'ChildWorkflowExecutionStarted',
      childWorkflowExecutionStartedEventAttributes: {
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
    {
      eventId: 3,
      eventType: 'ChildWorkflowExecutionTimedOut',
      childWorkflowExecutionTimedOutEventAttributes: {
        timeoutType: 'START_TO_CLOSE',
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'timedOut',
        timeoutType: 'START_TO_CLOSE',
      },
    },
    'timed out'
  )
})

test('terminated', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionInitiated',
      startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'testWorkflowId',
      },
    },
    {
      eventId: 2,
      eventType: 'ChildWorkflowExecutionStarted',
      childWorkflowExecutionStartedEventAttributes: {
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
    {
      eventId: 3,
      eventType: 'ChildWorkflowExecutionTerminated',
      childWorkflowExecutionTerminatedEventAttributes: {
        timeoutType: 'START_TO_CLOSE',
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'terminated',
      },
    },
    'terminated'
  )
})

test('failed', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionInitiated',
      startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'testWorkflowId',
      },
    },
    {
      eventId: 2,
      eventType: 'ChildWorkflowExecutionStarted',
      childWorkflowExecutionStartedEventAttributes: {
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
    {
      eventId: 3,
      eventType: 'ChildWorkflowExecutionFailed',
      childWorkflowExecutionFailedEventAttributes: {
        details: JSON.stringify({name: 'Error'}),
        reason: 'Error',
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'failed',
        reason: 'Error',
        details: {name: 'Error'},
      },
    },
    'failed'
  )
})

test('completed', async t => {
  const state = childWorkflows(undefined, [
    {
      eventId: 1,
      eventType: 'StartChildWorkflowExecutionInitiated',
      startChildWorkflowExecutionInitiatedEventAttributes: {
        workflowId: 'testWorkflowId',
      },
    },
    {
      eventId: 2,
      eventType: 'ChildWorkflowExecutionStarted',
      childWorkflowExecutionStartedEventAttributes: {
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
    {
      eventId: 3,
      eventType: 'ChildWorkflowExecutionCompleted',
      childWorkflowExecutionCompletedEventAttributes: {
        result: JSON.stringify({my: 'data'}),
        workflowExecution: {
          workflowId: 'testWorkflowId',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testWorkflowId: {
        status: 'completed',
        result: {my: 'data'},
      },
    },
    'completed'
  )
})
