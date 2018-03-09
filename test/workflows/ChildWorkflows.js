async function ChildWorkflows({
  input: {profileName},
  actions: {childWorkflow},
}) {
  const firstWorkflowResult = await childWorkflow({
    type: 'Dummy',
    id: `child-workflow-${profileName}-1`,
    input: {taskOptions: {args: [{result: 'some result'}]}},
    startToCloseTimeout: 3,
  })
  let secondWorkflowError
  try {
    await childWorkflow({
      type: 'Dummy',
      id: `child-workflow-${profileName}-2`,
      input: {taskOptions: {args: [{error: {message: 'some error'}}]}},
      startToCloseTimeout: 3,
    })
  } catch (error) {
    secondWorkflowError = error
  }

  return {firstWorkflowResult, secondWorkflowError}
}

module.exports = ChildWorkflows
