const test = require('ava')
const timer = require('./timer')
const {brieflyWaitForPromise} = require('soflow/test')

async function runAction(state = {timers: {}}) {
  const context = {
    namespace: 'test',
    state: {
      workflowExecution: {
        workflowType: {
          version: '2',
        },
      },
      ...state,
    },
    decisions: [],
  }

  const {error, result} = await brieflyWaitForPromise(
    timer(context, {
      id: 'testTimer',
      seconds: 60,
      data: {my: 'data'},
    })
  )

  return {error, result, decisions: context.decisions}
}

test('not started', async t => {
  const {result, error, decisions} = await runAction()

  t.deepEqual(
    decisions,
    [
      {
        decisionType: 'StartTimer',
        startTimerDecisionAttributes: {
          startToFireTimeout: '60',
          timerId: 'testTimer',
          control: JSON.stringify({my: 'data'}),
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
    timers: {
      testTimer: {
        status: 'startFailed',
        cause: 'TIMER_ID_ALREADY_IN_USE',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: Timer failed to start (TIMER_ID_ALREADY_IN_USE)',
    'provides a sensible error message'
  )
  t.is(error.code, 'StartTimerFailed', 'sets error.code')
  t.is(error.cause, 'TIMER_ID_ALREADY_IN_USE', 'sets error.cause')
})

test('fired', async t => {
  const {result, error, decisions} = await runAction({
    timers: {
      testTimer: {
        status: 'fired',
        data: {my: 'data'},
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(error, undefined, 'promise is not rejected')
  t.truthy(result, 'promise is resolved')
  t.deepEqual(
    result,
    {my: 'data'},
    'resolves the promise with the provided data'
  )
})
