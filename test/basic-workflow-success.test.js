const testProfiles = require('./helpers/testProfiles')

testProfiles('Basic workflow success', async (t, {executeWorkflow}) => {
  for (const taskType of ['activity', 'faas']) {
    const execution = await executeWorkflow({
      workflowId: `basic-workflow-success-${taskType}`,
      type: 'Dummy',
      input: {
        taskOptions: {args: [{result: 'myresult'}], type: taskType},
      },
    })

    const result = await execution.promise

    t.is(result, 'myresult', `(as ${taskType}) yields the correct result`)
  }
})
