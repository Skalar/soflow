import test from 'blue-tape'
import receiveSignal from './receiveSignal'

test('LocalWorkflow.Decider.Context.actions.receiveSignal()', {timeout: 1000}, async t => {
  const result = await receiveSignal.apply(
    {
      soflow: {
        receivedSignals: {
          mySig: [42]
        }
      }
    },
    [
      'mySig'
    ]
  )

  t.isEqual(result, 42, 'Returns the result of the signal')
})
