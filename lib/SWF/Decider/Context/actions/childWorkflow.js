import emptyPromise from '~/lib/SWF/Decider/Context/emptyPromise'

class ChildWorkflowError extends Error {}

async function childWorkflow({
  childPolicy = 'TERMINATE',
  control,
  executionStartToCloseTimeout = 600,
  input,
  taskPriority = this.state.workflowExecution.taskPriority,
  id: workflowId,
  type,
}) {
  const {
    workflowType: {version},
    lambdaRole,
    tagList,
    taskStartToCloseTimeout,
    taskPriority: parentTaskPriority,
  } = this.state.workflowExecution

  const namespacedType = `${this.namespace}_${type}`
  const childWorkflow = this.state.childWorkflow[`${namespacedType}_${workflowId}`]

  if (!childWorkflow) {
    this.decisions.push({
      decisionType: 'StartChildWorkflowExecution',
      startChildWorkflowExecutionDecisionAttributes: {
        childPolicy,
        control,
        executionStartToCloseTimeout: executionStartToCloseTimeout.toString(),
        input: JSON.stringify(input),
        taskStartToCloseTimeout,
        workflowId,
        workflowType: {
          name: namespacedType,
          version,
        },
        lambdaRole,
        tagList,
        taskPriority: taskPriority || parentTaskPriority,
      }
    })
  }
  else {
    switch (childWorkflow.state.name) {
      case 'startFailed': {
        const {cause, control} = childWorkflow.state
        const error = new ChildWorkflowError(cause)
        error.control = control
        throw error
      }
      case 'timedOut': {
        const {timeoutType} = childWorkflow.state
        throw new ChildWorkflowError(`Timeout: ${timeoutType}`)
      }
      case 'terminated': {
        throw new ChildWorkflowError('Terminated')
      }
      case 'failed': {
        const {reason, details} = childWorkflow.state
        const error = new ChildWorkflowError(details)
        error.reason = reason
        throw error
      }
      case 'completed': {
        const {result} = childWorkflow.state
        return result
      }
      case 'initiated':
      case 'started':
      case 'canceled':
    }
  }

  return emptyPromise
}

export default childWorkflow
