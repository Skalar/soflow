function ChildWorkflow(workflowEvents) {
  const instances = {}

  for (const event of workflowEvents) {
    switch (event.eventType) {
      case 'StartChildWorkflowExecutionInitiated': {
        const {
          workflowId,
          workflowType: {name: workflowTypeName},
        } = event.startChildWorkflowExecutionInitiatedEventAttributes

        instances[`${workflowTypeName}_${workflowId}`] = {
          state: {name: 'initiated'},
        }

        break
      }

      case 'StartChildWorkflowExecutionFailed': {
        const {
          cause,
          control,
          // decisionTaskCompletedEventId,
          // initiatedEventId,
          workflowId,
          workflowType: {name: workflowTypeName},
        } = event.startChildWorkflowExecutionFailedEventAttributes

        instances[`${workflowTypeName}_${workflowId}`] = {
          state: {name: 'startFailed', cause, control},
        }

        break
      }

      case 'ChildWorkflowExecutionStarted': {
        const {
          workflowExecution: {workflowId},
          // initiatedEventId,
          workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionStartedEventAttributes

        instances[`${workflowTypeName}_${workflowId}`] = {
          state: {name: 'started'},
        }
        break
      }

      case 'ChildWorkflowExecutionCanceled': {
        const {
          details,
          // initiatedEventId,
          // startedEventId,
          workflowExecution: {workflowId},
          workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionCanceledEventAttributes

        const instance = instances[`${workflowTypeName}_${workflowId}`]
        instance.state = {name: 'canceled', details}

        break
      }

      case 'ChildWorkflowExecutionTimedOut': {
        const {
          // initiatedEventId,
          // startedEventId,
          timeoutType,
          workflowExecution: {workflowId},
          workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionTimedOutEventAttributes

        const instance = instances[`${workflowTypeName}_${workflowId}`]
        instance.state = {name: 'timedOut', timeoutType}

        break
      }

      case 'ChildWorkflowExecutionTerminated': {
        const {
          // initiatedEventId,
          // startedEventId,
          workflowExecution: {workflowId},
          workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionTerminatedEventAttributes

        const instance = instances[`${workflowTypeName}_${workflowId}`]
        instance.state = {name: 'terminated'}

        break
      }

      case 'ChildWorkflowExecutionFailed': {
        const {
          details: detailsJSON,
          // initiatedEventId,
          reason,
          // startedEventId,
          workflowExecution: {workflowId},
          workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionFailedEventAttributes

        let details
        try {
          details = JSON.parse(detailsJSON)
        }
        catch (error) {
          details = detailsJSON
        }

        const instance = instances[`${workflowTypeName}_${workflowId}`]
        instance.state = {name: 'failed', details, reason}

        break
      }

      case 'ChildWorkflowExecutionCompleted': {
        const {
          // initiatedEventId,
          result,
          // startedEventId,
          workflowExecution: {workflowId},
          workflowType: {name: workflowTypeName},
        } = event.childWorkflowExecutionCompletedEventAttributes

        const instance = instances[`${workflowTypeName}_${workflowId}`]

        try {
          instance.state = {name: 'completed', result: JSON.parse(result)}
        }
        catch (error) {
          instance.state = {name: 'completed', result}
        }

        break
      }
    }
  }

  return instances
}


export default ChildWorkflow
