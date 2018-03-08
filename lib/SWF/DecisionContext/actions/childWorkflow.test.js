const test = require('ava')
const childWorkflow = require('./childWorkflow')
const {brieflyWaitForPromise} = require('soflow/test')

async function runAction(state = {childWorkflows: {}}) {
  const context = {
    namespace: 'test',
    state: {
      workflowExecution: {
        lambdaRole: 'myLambdaRole',
        workflowType: {
          version: 'v2',
        },
        tagList: ['myTag'],
        taskStartToCloseTimeout: '5',
        taskList: 'test_v2',
      },
      ...state,
    },
    decisions: [],
  }

  const {error, result} = await brieflyWaitForPromise(
    childWorkflow(context, {
      type: 'OtherWorkflow',
      id: 'childworkflowid',
      input: {my: 'data'},
    })
  )

  return {error, result, decisions: context.decisions}
}

test('not scheduled', async t => {
  const {result, error, decisions} = await runAction()

  t.deepEqual(
    decisions,
    [
      {
        decisionType: 'StartChildWorkflowExecution',
        startChildWorkflowExecutionDecisionAttributes: {
          childPolicy: 'TERMINATE',
          control: undefined,
          executionStartToCloseTimeout: '600',
          input: JSON.stringify({my: 'data'}),
          tagList: ['myTag'],
          lambdaRole: 'myLambdaRole',
          taskStartToCloseTimeout: '5',
          taskList: {name: 'test_v2'},
          taskPriority: undefined,
          workflowId: 'test_childworkflowid',
          workflowType: {
            name: 'OtherWorkflow',
            version: 'v2',
          },
        },
      },
    ],
    'makes a decision to schedule activity task'
  )

  t.is(error, undefined, 'promise is not rejected')
  t.is(result, undefined, 'promise does not resolve')
})

test('start failed', async t => {
  const {result, error, decisions} = await runAction({
    childWorkflows: {
      test_childworkflowid: {
        status: 'startFailed',
        cause: 'OPERATION_NOT_PERMITTED',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: Child workflow failed to start: OPERATION_NOT_PERMITTED',
    'provides a sensible rejection error'
  )
})

test('timed out', async t => {
  const {result, error, decisions} = await runAction({
    childWorkflows: {
      test_childworkflowid: {
        status: 'timedOut',
        timeoutType: 'START_TO_CLOSE',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: Child workflow timed out: START_TO_CLOSE',
    'provides a sensible rejection error'
  )
})

test('terminated', async t => {
  const {result, error, decisions} = await runAction({
    childWorkflows: {
      test_childworkflowid: {
        status: 'terminated',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: Child workflow terminated',
    'provides a sensible rejection error'
  )
})

test('failed', async t => {
  const {result, error, decisions} = await runAction({
    childWorkflows: {
      test_childworkflowid: {
        status: 'failed',
        details: {
          name: 'Error',
          message: 'test error',
          stack: '...',
        },
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.deepEqual(
    error,
    {
      name: 'Error',
      message: 'test error',
      stack: '...',
    },
    'provides a sensible rejection error'
  )
})

test('completed', async t => {
  const {result, error, decisions} = await runAction({
    childWorkflows: {
      test_childworkflowid: {
        status: 'completed',
        result: {my: 'result'},
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(error, undefined, 'promise is not rejected')
  t.truthy(result, 'promise is resolved')
  t.deepEqual(result, {my: 'result'}, 'resolves with the result')
})
