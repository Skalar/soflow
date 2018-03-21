const test = require('ava')
const cancelTimer = require('./cancelTimer')
const {brieflyWaitForPromise} = require('soflow/test')

async function runAction(state = {timers: {}}, {fail = false} = {}) {
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
    cancelTimer(context, 'test', {fail})
  )

  return {error, result, decisions: context.decisions}
}

test('timer does not exist', async t => {
  const {result, error, decisions} = await runAction()

  t.deepEqual(decisions, [], 'makes no decisions')

  t.is(result, undefined, 'promise does not resolve')
  t.is(error, undefined)
})

test('timer does not exist (fail = true)', async t => {
  const {result, error, decisions} = await runAction(undefined, {fail: true})

  t.deepEqual(decisions, [], 'makes no decisions')

  t.is(result, undefined, 'promise does not resolve')

  t.truthy(error, 'rejects the promise')
  t.is(
    error.toString(),
    'Error: There is no such timer',
    'provides a sensible error message'
  )
})

test('timer fired', async t => {
  const {result, error, decisions} = await runAction({
    timers: {
      test: {
        status: 'fired',
      },
    },
  })

  t.deepEqual(decisions, [], 'makes no decisions')

  t.is(result, undefined, 'promise does not resolve')

  t.truthy(error, 'rejects the promise')
  t.is(
    error.toString(),
    'Error: Cannot cancel timer with status "fired"',
    'provides a sensible error message'
  )
})

test('cancel failed', async t => {
  const {result, error, decisions} = await runAction({
    timers: {
      test: {
        status: 'cancelFailed',
        cause: 'Some cause',
      },
    },
  })

  t.deepEqual(decisions, [], 'makes no decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'rejects the promise')
  t.is(
    error.toString(),
    'Error: Failed to cancel timer (Some cause)',
    'provides a sensible error message'
  )
})

test('started', async t => {
  const {result, error, decisions} = await runAction({
    timers: {
      test: {
        status: 'started',
      },
    },
  })

  t.deepEqual(
    decisions,
    [
      {
        decisionType: 'CancelTimer',
        cancelTimerDecisionAttributes: {
          timerId: 'test',
        },
      },
    ],
    'makes decision to cancel timer'
  )
  t.truthy(result, 'promise resolves')
  t.is(error, undefined, 'promise does not reject')
})

test('canceled', async t => {
  const {result, error, decisions} = await runAction({
    timers: {
      test: {
        status: 'canceled',
      },
    },
  })

  t.deepEqual(decisions, [], 'makes no decisions')
  t.is(error, undefined, 'promise does not reject')
  t.truthy(result, 'promise resolves')
})
