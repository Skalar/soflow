const testProfiles = require('./helpers/testProfiles')

testProfiles('Child workflows', async (t, {executeWorkflow}) => {
  const execution = await executeWorkflow({
    workflowId: 'child-workflows',
    type: 'ChildWorkflows',
  })

  const {firstWorkflowResult, secondWorkflowError} = await execution.promise

  t.is(
    firstWorkflowResult,
    'some result',
    'returns result from successful child workflow2'
  )

  t.truthy(secondWorkflowError, 'returns error from failed child workflow')
  t.is(secondWorkflowError.message, 'some error', 'retains error message')
  t.truthy(secondWorkflowError.stack, 'includes stacktrace')
})
