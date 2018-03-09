const testProfiles = require('./helpers/testProfiles')

testProfiles('Task and workflow proxies', async (t, {executeWorkflow}) => {
  const execution = await executeWorkflow({
    workflowId: 'task-and-workflow-proxies',
    type: 'TaskAndWorkflowProxies',
  })

  const {taskResult, childworkflowResult} = await execution.promise

  t.is(taskResult, 'task-success', 'yields the task result')
  t.is(childworkflowResult, 'child-workflow-success', 'yields the task result')
})
