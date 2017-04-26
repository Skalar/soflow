import test from 'blue-tape'
import receiveSignal from './receiveSignal'

const timeout = 1000

function createContext(givenContext) {
  return {
    namespace: 'test',
    ref: 0,
    decisions: [],
    state: {
      signalReceived: {}
    },
    ...givenContext
  }
}

function run(name, context) {
  return receiveSignal.apply(context, [name])
}

test('SWF.Decider.Context.actions.receiveSignal()', {timeout}, async t => {
  {
    const context = createContext({
      state: {
        signalReceived: {
          testSignal: {
            inputList: [JSON.stringify(42)],
            state: {name: 'received', receivedCount: 1}
          }
        }
      }
    })

    t.isEqual(
      await run('testSignal', context),
      42,
      'resolves the promise with the input'
    )
  }
})

test('SWF.Decider.Context.actions.receiveSignal() with multiple signals', {timeout}, async t => {
  {
    const context = createContext({
      state: {
        signalReceived: {
          testSignal: {
            inputList: [JSON.stringify('A'), JSON.stringify('B')],
            state: {name: 'received', receivedCount: 2}
          }
        }
      }
    })

    t.isEqual(
      await run('testSignal', context),
      'A',
      'resolves the first promise with the first input'
    )

    t.isEqual(
      await run('testSignal', context),
      'B',
      'resolves the second promise with the second input'
    )
  }
})
