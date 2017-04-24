import test from 'blue-tape'
import childWorkflow from './childWorkflow'

test('LocalWorkflow.Decider.Context.actions.childWorkflow()', {timeout: 1000}, async t => {
  t.plan(2)

  const result = await childWorkflow.apply(
    {
      soflow: {
        workflows: {
          async TestWorkflow({input}) {
            t.isEqual(input, 'test', 'Passes input correctly')

            return 'result'
          }
        }
      },
    },
    [
      'TestWorkflow',
      {input: 'test'}
    ]
  )

  t.isEqual(result, 'result', 'Returns the result of the task')
})
