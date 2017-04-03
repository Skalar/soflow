import test from 'blue-tape'
import runTask from './runTask'

test('LocalWorkflow.Decider.Context.actions.runTask()', {timeout: 1000}, async t => {
  const result = await runTask.apply(
    {
      _tasks: {
        async double(number) {
          return number * 2
        }
      }
    },
    [
      'double',
      [2]
    ]
  )

  t.isEqual(result, 4, 'Returns the result of the task')
})
