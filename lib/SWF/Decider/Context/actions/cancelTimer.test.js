import test from 'blue-tape'
import cancelTimer from './cancelTimer'

function run(id, givenContext) {
  const context = {
    namespace: 'test',
    decisions: [],
    state: {
      timer: {
        mytimer: {
          state: {name: 'started'},
          control: JSON.stringify({my: 'payload'})
        }
      }
    },
    ...givenContext
  }

  return {
    promise: cancelTimer.apply(context, [id]),
    context,
  }
}


test('SWF.Decider.Context.actions.cancelTimer()', {timeout: 1000}, async t => {
  {
    const {context} = run('mytimer')

    t.deepEquals(
      context.decisions,
      [
        {
          decisionType: 'CancelTimer',
          cancelTimerDecisionAttributes: {
            timerId: 'mytimer'
          }
        }
      ],
      'adds a CancelTimer decision'
    )
  }
})
