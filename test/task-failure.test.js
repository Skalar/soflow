const testProfiles = require('./helpers/testProfiles')

testProfiles('Task failure', async (t, {executeWorkflow}) => {
  t.plan(6)

  for (const taskType of ['activity', 'faas']) {
    try {
      const execution = await executeWorkflow({
        workflowId: `task-failure-${taskType}`,
        type: 'Dummy',
        input: {
          taskOptions: {
            args: [{error: {message: 'Test error'}}],
            type: taskType,
          },
        },
      })

      await execution.promise
    } catch (error) {
      t.truthy(error, 'throws an error')
      t.is(error.message, 'Test error', 'retains error message')
      t.is(error.name, 'Error', 'retains error name')
    }
  }
})
