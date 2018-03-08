function childWorkflow(
  context,
  {
    childPolicy = 'TERMINATE',
    control,
    executionStartToCloseTimeout = 600,
    input,
    prefixWorkflowId = true,
    taskPriority = context.state.workflowExecution.taskPriority,
    id,
    type,
    taskList,
  }
) {
  const {
    workflowType: {version},
    lambdaRole,
    tagList,
    taskStartToCloseTimeout,
    taskPriority: parentTaskPriority,
  } = context.state.workflowExecution

  const namespacedType = [context.workflowPrefix, type].filter(v => v).join('_')
  const workflowId = prefixWorkflowId
    ? [context.namespace, id].filter(v => v).join('_')
    : id

  const childWorkflow = context.state.childWorkflows[workflowId]

  return new Promise((resolve, reject) => {
    if (!childWorkflow) {
      context.decisions.push({
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
          taskList: {
            name: taskList || context.state.workflowExecution.taskList,
          },
          lambdaRole,
          tagList,
          taskPriority: taskPriority || parentTaskPriority,
        },
      })
    } else {
      switch (childWorkflow.status) {
        case 'startFailed': {
          const {cause, control} = childWorkflow
          const error = new Error(`Child workflow failed to start: ${cause}`)
          Object.assign(error, {control, cause})

          return reject(error)
        }
        case 'timedOut': {
          return reject(
            new Error(`Child workflow timed out: ${childWorkflow.timeoutType}`)
          )
        }
        case 'terminated': {
          return reject(new Error('Child workflow terminated'))
        }
        case 'failed': {
          const {details} = childWorkflow
          return reject(details)
        }
        case 'completed': {
          const {result} = childWorkflow
          return resolve(result)
        }
        case 'initiated':
        case 'started':
        case 'canceled':
      }
    }
  })
}

module.exports = childWorkflow
