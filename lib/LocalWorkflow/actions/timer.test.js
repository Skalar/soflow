import test from 'blue-tape'
import timer from './timer'

test('LocalWorkflow.Decider.Context.actions.timer()', {timeout: 1000}, async t => {
  t.plan(2)

  await timer.apply(
    {
      soflow: {
        timers: {}
      }
    },
    [
      20,
      'timer',
      (cb, ms) => {
        t.isEqual(ms, 20000, 'Waits the correct number of ms')
        cb()
      }
    ]
  )

  t.ok('It resolves the promises')
})
