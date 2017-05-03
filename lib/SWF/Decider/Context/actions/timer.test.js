import test from 'blue-tape'
import timer from './timer'


function run(timerArgs, givenContext) {
  const context = {
    namespace: 'test',
    decisions: [],
    state: {
      timer: {}
    },
    ...givenContext
  }

  return {
    promise: timer.apply(context, [timerArgs]),
    context,
  }
}


test('SWF.Decider.Context.actions.timer()', {timeout: 1000}, async t => {
  {
    const {context} = run({
      id: 'mytimer',
      seconds: 10,
      data: {my: 'payload'}
    })

    t.deepEquals(
      context.decisions,
      [
        {
          decisionType: 'StartTimer',
          startTimerDecisionAttributes: {
            timerId: 'mytimer',
            startToFireTimeout: '10',
            control: JSON.stringify({my: 'payload'})
          }
        }
      ],
      'starts the timer'
    )
  }

  {
    const {promise} = run({
      id: 'mytimer',
      seconds: 10,
      data: {my: 'payload'}
    }, {
      state: {
        timer: {
          mytimer: {
            state: {name: 'fired'},
            control: JSON.stringify({my: 'payload'})
          }
        }
      }
    })

    t.deepEqual(
      await promise,
      {my: 'payload'},
      'resolves the promise with the data'
    )
  }
})
