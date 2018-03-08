const test = require('ava')
const task = require('./task')
const {brieflyWaitForPromise} = require('soflow/test')

async function runAction(state = {lambdaFunctions: {}}) {
  const context = {
    namespace: 'test',
    state: {
      workflowExecution: {
        workflowType: {
          version: 'test',
        },
      },
      ...state,
    },
    decisions: [],
  }

  const {error, result} = await brieflyWaitForPromise(
    task(context, {
      type: 'faas',
      name: 'myFunction',
      id: 'invocation1',
      args: [{hey: 'ho'}],
      startToCloseTimeout: 10,
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
        decisionType: 'ScheduleLambdaFunction',
        scheduleLambdaFunctionDecisionAttributes: {
          id: 'invocation1',
          name: 'test_myFunction',
          input: JSON.stringify([{hey: 'ho'}]),
          startToCloseTimeout: '10',
        },
      },
    ],
    'makes a decision to schedule activity task'
  )

  t.is(error, undefined, 'promise is not rejected')
  t.is(result, undefined, 'promise does not resolve')
})

test('schedule failed', async t => {
  const {result, error, decisions} = await runAction({
    lambdaFunctions: {
      invocation1: {
        status: 'scheduleFailed',
        cause: 'OPERATION_NOT_PERMITTED',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: Lambda function failed to schedule: OPERATION_NOT_PERMITTED',
    'provides a sensible rejection error'
  )
})

test('scheduled', async t => {
  const {result, error, decisions} = await runAction({
    lambdaFunctions: {
      invocation1: {
        status: 'scheduled',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.is(error, undefined, 'promise is not rejected')
})

test('timed out', async t => {
  const {result, error, decisions} = await runAction({
    lambdaFunctions: {
      invocation1: {
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
    'Error: Lambda function timed out: START_TO_CLOSE',
    'provides a sensible rejection error'
  )
})

test('completed', async t => {
  const {result, error, decisions} = await runAction({
    lambdaFunctions: {
      invocation1: {
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
