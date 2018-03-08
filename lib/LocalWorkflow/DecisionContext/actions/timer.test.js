const test = require('ava')
const timer = require('./timer')
const DecisionContext = require('../')

test('success', async t => {
  t.plan(2)

  const context = new DecisionContext({
    workflows: {},
    tasks: {},
  })

  const result = await timer(
    context,
    {
      seconds: 2,
      data: {my: 'data'},
    },
    (cb, timeout) => {
      t.is(timeout, 2000, 'waits the correct amount of time')
      cb()
    }
  )

  t.deepEqual(result, {my: 'data'}, 'resolves with the data given')
})
