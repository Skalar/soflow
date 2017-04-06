import test from 'blue-tape'
import executeWorkflow from './executeWorkflow'

test('LocalWorkflow.executeWorkflow()', {timeout: 1000}, async t => {
  const result = await executeWorkflow({
    name: 'Test',
    input: 2,
    workflows: {
      async Test({input, tasks: {doubleNumber}}) {
        return doubleNumber(input)
      },
    },
    tasks: {
      async doubleNumber(number) {
        return number * 2
      }
    },
  })

  t.isEqual(result, 4, 'Returns the result of the workflow')
})
