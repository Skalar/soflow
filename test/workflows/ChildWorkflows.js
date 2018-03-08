async function ChildWorkflows({actions: {childWorkflow}}) {
  const firstWorkflowResult = await childWorkflow({
    type: 'Dummy',
    id: 'child-workflow-1',
    input: {taskOptions: {args: [{result: 'some result'}]}},
    startToCloseTimeout: 3,
  })
  let secondWorkflowError
  try {
    await childWorkflow({
      type: 'Dummy',
      id: 'child-workflow-2',
      input: {taskOptions: {args: [{error: {message: 'some error'}}]}},
      startToCloseTimeout: 3,
    })
  } catch (error) {
    secondWorkflowError = error
  }

  return {firstWorkflowResult, secondWorkflowError}
}

module.exports = ChildWorkflows
