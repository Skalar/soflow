import test from 'blue-tape'
import receiveSignal from './receiveSignal'


function run({context: givenContext, name}) {
  const context = {
    namespace: 'test',
    ref: 0,
    decisions: [],
    state: {
      signalReceived: {}
    },
    ...givenContext
  }

  return {
    promise: receiveSignal.apply(context, [name]),
    context,
  }
}

test('SWF.Decider.Context.actions.receiveSignal()', {timeout: 1000}, async t => {
  {
    const {promise} = run({
      context: {
        state: {
          signalReceived: {
            testSignal: {
              input: JSON.stringify(42),
              state: {name: 'received', input: JSON.stringify(42)}
            }
          }
        }
      },
      name: 'testSignal'
    })

    t.isEqual(
      await promise,
      42,
      'resolves the promise with the input'
    )
  }
})
