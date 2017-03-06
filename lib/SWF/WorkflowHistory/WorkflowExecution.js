function WorkflowExecution(workflowEvents) {
  for (const event of workflowEvents) {
    if (event.eventType === 'WorkflowExecutionStarted') {
      const attributes = event.workflowExecutionStartedEventAttributes
      return {...attributes, input: JSON.parse(attributes.input)}
    }
  }
}

export default WorkflowExecution
