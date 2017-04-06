import test from 'blue-tape'
import cancelTimer from './cancelTimer'

test('LocalWorkflow.Decider.Context.actions.cancelTimer()', {timeout: 1000}, async t => {
  const context = {
    _timers: {
      mytimer: 'timeout'
    }
  }

  cancelTimer.apply(
    context,
    [
      'mytimer',
      (timeout) => {
        t.isEqual(timeout, 'timeout', 'Clears the timeout')
      }
    ]
  )

  t.equal(context._timers.mytimer, undefined, 'Removes the timer from the context')
})
