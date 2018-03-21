const test = require('ava')
const DecisionContext = require('../')

test('timer does not exist', async t => {
  const context = new DecisionContext({
    state: {
      timers: {},
    },
    workflows: {},
    tasks: {},
  })

  await context.actions.cancelTimer('mytimer')
  t.pass('does not throw an error')
})

test('timer does not exist (fail = true)', async t => {
  t.plan(2)

  const context = new DecisionContext({
    state: {
      timers: {},
    },
    workflows: {},
    tasks: {},
  })

  try {
    await context.actions.cancelTimer('mytimer', {fail: true})
  } catch (error) {
    t.truthy(error, 'throw an error')
    t.is(error.toString(), 'Error: No such timer')
  }
})

test('active timer', async t => {
  t.plan(1)

  const context = new DecisionContext({
    state: {
      timers: {
        mytimer: {
          cancel: () => {
            t.pass('cancels timer')
          },
        },
      },
    },
    workflows: {},
    tasks: {},
  })

  await context.actions.cancelTimer('mytimer')
})
