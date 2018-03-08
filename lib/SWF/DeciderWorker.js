const Worker = require('./Worker')
const workflowStateReducer = require('./workflowStateReducer')
const serializeError = require('serialize-error')
const DecisionContext = require('./DecisionContext')

class DeciderWorker extends Worker {
  async pollForTask() {
    const {identity} = this

    let task, workflowState

    while (!task || task.nextPageToken) {
      const request = this.swf.pollForDecisionTask({
        domain: this.swfDomain,
        identity,
        taskList: {name: this.taskList},
        nextPageToken: task ? task.nextPageToken : undefined,
      })

      this.pollRequests.add(request)

      try {
        task = await request.promise()
      } finally {
        this.pollRequests.delete(request)
      }

      if (!task.taskToken) {
        return
      }

      workflowState = workflowStateReducer(workflowState, task.events)
    }

    return {...task, workflowState}
  }

  async handleTask(task) {
    const {workflows, tasks, namespace} = this

    const {
      taskToken,
      workflowType: {name: namespacedType},
      workflowState,
      workflowExecution,
    } = task

    const workflowType = namespacedType.replace(`${this.workflowPrefix}_`, '')

    if (workflowType === 'DeciderControl') {
      return await this.handleDeciderControl(task)
    }

    const decisionContext = new DecisionContext({
      workflows,
      tasks,
      namespace,
      workflowType,
      state: workflowState,
    })

    const decisions = await this.getWorkflowDecisions(
      workflowType,
      decisionContext,
      workflowExecution
    )

    return await this.swf
      .respondDecisionTaskCompleted({taskToken, decisions})
      .promise()
  }

  async handleDeciderControl() {
    // Do more sophisticated stuff with input here in the future.
    // Currently we only need to be able to gracefully shut down deciders.
    this.logger.info('Got DeciderControl workflow, shutting down..')
    this.stop()
    // workflow = () => Promise.resolve(true)
    // what do we do here?
  }

  async getWorkflowDecisions(workflowType, decisionContext, workflowExecution) {
    const workflow = this.workflows[workflowType]
    let workflowPromiseFulfilled, workflowResult, workflowError

    if (typeof workflow !== 'function') {
      workflowError = `Unknown workflow '${workflowType}'`
      workflowPromiseFulfilled = true
    } else {
      const workflowDecisionPromise = workflow(decisionContext)

      workflowDecisionPromise
        .then(result => {
          workflowPromiseFulfilled = true
          workflowResult = result
        })
        .catch(error => {
          workflowPromiseFulfilled = true
          workflowError = error
        })

      // Wait for workflow decider function to complete
      await new Promise(resolve => setImmediate(resolve))
    }

    // We are not done yet, so these decisions suffice
    if (!workflowPromiseFulfilled) {
      return decisionContext.decisions
    }

    // if callback requested and not scheduled do it here and return
    if (
      !decisionContext.state.workflowExecution.parentWorkflowExecution &&
      !decisionContext.state.activityTasks.workflowCallback
    ) {
      return [
        ...decisionContext.decisions,
        {
          decisionType: 'ScheduleActivityTask',
          scheduleActivityTaskDecisionAttributes: {
            activityId: 'workflowCallback',
            activityType: {
              name: [this.workflowPrefix, 'workflowCallback']
                .filter(v => v)
                .join('_'),
              version: 'default',
            },
            input: JSON.stringify(
              workflowError
                ? {error: serializeError(workflowError)}
                : {result: workflowResult}
            ),
            taskList: {
              name: workflowExecution.runId,
            },
            heartbeatTimeout: '5',
          },
        },
      ]
    }

    if (workflowError) {
      return [
        ...decisionContext.decisions,
        {
          decisionType: 'FailWorkflowExecution',
          failWorkflowExecutionDecisionAttributes: {
            reason: workflowError.name || workflowError.toString(),
            details: JSON.stringify(serializeError(workflowError)),
          },
        },
      ]
    }

    return [
      {
        ...decisionContext.decisions,
        decisionType: 'CompleteWorkflowExecution',
        completeWorkflowExecutionDecisionAttributes: {
          result: JSON.stringify(workflowResult),
        },
      },
    ]
  }
}

module.exports = DeciderWorker
