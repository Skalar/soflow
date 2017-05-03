import test from 'blue-tape'
import ChildWorkflow from './ChildWorkflow'

const events = {
  initiated: {
    eventId: 1,
    eventType: 'StartChildWorkflowExecutionInitiated',
    startChildWorkflowExecutionInitiatedEventAttributes: {
      workflowId: 'mychildworkflow',
      workflowType: {name: 'ChildWorkflow'},
    }
  },
  startFailed: {
    eventId: 2,
    eventType: 'StartChildWorkflowExecutionFailed',
    startChildWorkflowExecutionFailedEventAttributes: {
      workflowId: 'mychildworkflow',
      workflowType: {name: 'ChildWorkflow'},
      cause: 'WORKFLOW_TYPE_DOES_NOT_EXIST',
      control: null,
    }
  },
  started: {
    eventId: 2,
    eventType: 'ChildWorkflowExecutionStarted',
    childWorkflowExecutionStartedEventAttributes: {
      workflowExecution: {workflowId: 'mychildworkflow'},
      workflowType: {name: 'ChildWorkflow'},
    }
  },
  canceled: {
    eventId: 3,
    eventType: 'ChildWorkflowExecutionCanceled',
    childWorkflowExecutionCanceledEventAttributes: {
      workflowType: {name: 'ChildWorkflow'},
      workflowExecution: {workflowId: 'mychildworkflow'},
      details: 'mydetails'
    }
  },
  timedOut: {
    eventId: 3,
    eventType: 'ChildWorkflowExecutionTimedOut',
    childWorkflowExecutionTimedOutEventAttributes: {
      workflowType: {name: 'ChildWorkflow'},
      workflowExecution: {workflowId: 'mychildworkflow'},
      startedEventId: 2,
      timeoutType: 'START_TO_CLOSE'
    }
  },
  terminated: {
    eventId: 3,
    eventType: 'ChildWorkflowExecutionTerminated',
    childWorkflowExecutionTerminatedEventAttributes: {
      workflowType: {name: 'ChildWorkflow'},
      workflowExecution: {workflowId: 'mychildworkflow'},
    }
  },
  failed: {
    eventId: 3,
    eventType: 'ChildWorkflowExecutionFailed',
    childWorkflowExecutionFailedEventAttributes: {
      workflowExecution: {workflowId: 'mychildworkflow'},
      workflowType: {name: 'ChildWorkflow'},
      startedEventId: 2,
      reason: 'HandledError',
      details: JSON.stringify({
        errorType: 'UserUnreachable',
        errorMessage: 'Cannot reach user on any device',
        stackTrace: [],
      }),
    }
  },
  failedNonJson: {
    eventId: 3,
    eventType: 'ChildWorkflowExecutionFailed',
    childWorkflowExecutionFailedEventAttributes: {
      workflowExecution: {workflowId: 'mychildworkflow'},
      workflowType: {name: 'ChildWorkflow'},
      startedEventId: 2,
      reason: 'HandledError',
      details: 'details',
    }
  },
  completed: {
    eventId: 3,
    eventType: 'ChildWorkflowExecutionCompleted',
    childWorkflowExecutionCompletedEventAttributes: {
      workflowExecution: {workflowId: 'mychildworkflow'},
      workflowType: {name: 'ChildWorkflow'},
      startedEventId: 2,
      result: JSON.stringify('myresult'),
    }
  },
}

test('SWF.WorkflowHistory.ChildWorkflow', {timeout: 1000}, async t => {
  t.deepEqual(
    ChildWorkflow([
      events.initiated
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {
        name: 'initiated',
      },
    },
    'failed start'
  )

  t.deepEqual(
    ChildWorkflow([
      events.startFailed
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {
        name: 'startFailed',
        cause: 'WORKFLOW_TYPE_DOES_NOT_EXIST',
        control: null,
      },
    },
    'failed start'
  )

  t.deepEqual(
    ChildWorkflow([
      events.started
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {name: 'started'},
    },
    'started'
  )

  t.deepEqual(
    ChildWorkflow([
      events.started,
      events.canceled,
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {name: 'canceled', details: 'mydetails'},
    },
    'canceled'
  )

  t.deepEqual(
    ChildWorkflow([
      events.started,
      events.timedOut,
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {name: 'timedOut', timeoutType: 'START_TO_CLOSE'},
    },
    'timed out'
  )

  t.deepEqual(
    ChildWorkflow([
      events.started,
      events.terminated,
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {name: 'terminated'},
    },
    'terminated'
  )

  t.deepEqual(
    ChildWorkflow([
      events.started,
      events.failed,
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {
        name: 'failed',
        reason: 'HandledError',
        details: {
          errorType: 'UserUnreachable',
          errorMessage: 'Cannot reach user on any device',
          stackTrace: [],
        }
      },
    },
    'failed'
  )

  t.deepEqual(
    ChildWorkflow([
      events.started,
      events.failedNonJson,
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {
        name: 'failed',
        reason: 'HandledError',
        details: 'details'
      },
    },
    'failed non-json'
  )

  t.deepEqual(
    ChildWorkflow([
      events.started,
      events.completed,
    ]).ChildWorkflow_mychildworkflow,
    {
      state: {
        name: 'completed',
        result: 'myresult',
      },
    },
    'completed'
  )
})
