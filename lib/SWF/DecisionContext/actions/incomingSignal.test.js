const test = require('ava')
const incomingSignal = require('./incomingSignal')
const {brieflyWaitForPromise} = require('soflow/test')
const DecisionContext = require('../')

test('not received', async t => {
  const context = new DecisionContext({
    state: {
      incomingSignals: {},
    },
  })

  const {error, result} = await brieflyWaitForPromise(
    incomingSignal(context, 'mySignal')
  )

  t.deepEqual(context.decisions, [], 'makes no decisions')

  t.is(error, undefined, 'promise is not rejected')
  t.is(result, undefined, 'promise does not resolve')
})

test('received once', async t => {
  const context = new DecisionContext({
    state: {
      incomingSignals: {
        mySignal: [{input: {my: 'data'}, receivedAt: new Date('2018-01-01')}],
      },
    },
  })

  {
    const {error, result} = await brieflyWaitForPromise(
      incomingSignal(context, 'mySignal')
    )
    t.is(error, undefined, 'first invocation: promise is not rejected')
    t.truthy(result, 'first invocation: promise is resolved')
    t.deepEqual(
      result,
      {input: {my: 'data'}, receivedAt: new Date('2018-01-01')},
      'first invocation: resolves with the correct result'
    )
  }

  {
    const {error, result} = await brieflyWaitForPromise(
      incomingSignal(context, 'mySignal')
    )
    t.is(error, undefined, 'second invocation: promise is not rejected')
    t.is(result, undefined, 'second invocation: promise is not resolved')
  }

  {
    const {error, result} = await brieflyWaitForPromise(
      incomingSignal(context, 'mySignal2')
    )
    t.is(
      error,
      undefined,
      'invocation with other signal name: promise is not rejected'
    )
    t.is(
      result,
      undefined,
      'invocation with other signal name: promise is not resolved'
    )
  }

  t.deepEqual(context.decisions, [], 'makes no decisions')
})

test('received twice', async t => {
  const context = new DecisionContext({
    state: {
      incomingSignals: {
        mySignal: [
          {input: {my: 'data'}, receivedAt: new Date('2018-01-01')},
          {input: {my: 'otherdata'}, receivedAt: new Date('2018-01-02')},
        ],
      },
    },
  })
  {
    const {error, result} = await brieflyWaitForPromise(
      incomingSignal(context, 'mySignal')
    )
    t.is(error, undefined, 'first invocation: promise is not rejected')
    t.truthy(result, 'first invocation: promise is resolved')
    t.deepEqual(
      result,
      {input: {my: 'data'}, receivedAt: new Date('2018-01-01')},
      'first invocation: resolves with the correct result'
    )
  }

  {
    const {error, result} = await brieflyWaitForPromise(
      incomingSignal(context, 'mySignal')
    )
    t.is(error, undefined, 'second invocation: promise is not rejected')
    t.truthy(result, 'second invocation: promise is resolved')
    t.deepEqual(
      result,
      {input: {my: 'otherdata'}, receivedAt: new Date('2018-01-02')},
      'second invocation: resolves with the correct result'
    )
  }

  {
    const {error, result} = await brieflyWaitForPromise(
      incomingSignal(context, 'mySignal2')
    )
    t.is(
      error,
      undefined,
      'invocation with other signal name: promise is not rejected'
    )
    t.is(
      result,
      undefined,
      'invocation with other signal name: promise is not resolved'
    )
  }

  t.deepEqual(context.decisions, [], 'makes no decisions')
})
