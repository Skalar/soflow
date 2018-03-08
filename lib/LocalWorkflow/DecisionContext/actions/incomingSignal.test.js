const test = require('ava')
const DecisionContext = require('../')
const {brieflyWaitForPromise} = require('soflow/test')

test('signal received prior to awaiting it', async t => {
  const context = new DecisionContext({
    workflowId: 'myWorkflow',
    workflows: {},
    tasks: {},
  })
  context.registerIncomingSignal('mySignal', {my: 'input'})
  const promise = context.actions.incomingSignal('mySignal')
  const result = await promise
  t.deepEqual(
    result.input,
    {my: 'input'},
    'resolves when signal was sent prior to awaiting it'
  )
})

test('signal received after waiting it', async t => {
  const context = new DecisionContext({
    workflowId: 'myWorkflow',
    workflows: {},
    tasks: {},
  })
  const promise = context.actions.incomingSignal('mySignal')

  context.registerIncomingSignal('mySignal', {my: 'input2'})
  const result = await promise
  t.deepEqual(
    result.input,
    {my: 'input2'},
    'resolves when signal was sent after awaiting it'
  )
})

test('awaiting signal without receiving it', async t => {
  const context = new DecisionContext({
    workflowId: 'myWorkflow',
    workflows: {},
    tasks: {},
  })
  const promise = context.actions.incomingSignal('mySignal')
  const {error, result} = brieflyWaitForPromise(promise)

  t.deepEqual(
    error,
    undefined,
    'does not reject signal that is not yet received'
  )
  t.deepEqual(
    result,
    undefined,
    'does not resolve signal that is not yet received'
  )
})
