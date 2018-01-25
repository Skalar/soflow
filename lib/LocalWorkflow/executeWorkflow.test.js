import test from 'blue-tape'
import executeWorkflow from './executeWorkflow'

test('LocalWorkflow.executeWorkflow()', {timeout: 1000}, async t => {
  const result = await executeWorkflow({
    type: 'Test',
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

test('LocalWorkflow.executeWorkflow() with waitForCompletion set to false', async t => {
  const result = await executeWorkflow({
    type: 'Test',
    waitForCompletion: false,
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

  t.ok(result.runId, 'Returns an execution result')
  t.isEqual('string', typeof result.runId, 'The runId is a string')
})
