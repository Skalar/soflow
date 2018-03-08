function workflowExecution(workflowExecution = {}, events = []) {
  for (const event of events) {
    if (event.eventType === 'WorkflowExecutionStarted') {
      const {
        input: inputJSON,
        taskList: {name: taskList},
        ...rest
      } = event.workflowExecutionStartedEventAttributes

      return {...rest, taskList, input: JSON.parse(inputJSON)}
    }
  }

  return workflowExecution
}

module.exports = workflowExecution
