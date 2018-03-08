function signalWorkflowExecution(
  context,
  {
    signalName,
    workflowId: givenWorkflowId,
    runId,
    input,
    prefixWorkflowId = true,
    signalId = context.counter(
      'signalWorkflowExecution',
      prefixWorkflowId
        ? `${context.namespace}_${givenWorkflowId}`
        : givenWorkflowId,
      runId,
      signalName
    ),
  } = {}
) {
  return new Promise((resolve, reject) => {
    const workflowId = prefixWorkflowId
      ? `${context.namespace}_${givenWorkflowId}`
      : givenWorkflowId

    const signalKey = [workflowId, runId, signalName, signalId].join('_')
    const signal = context.state.outgoingSignals[signalKey]

    if (!signal) {
      context.decisions.push({
        decisionType: 'SignalExternalWorkflowExecution',
        signalExternalWorkflowExecutionDecisionAttributes: {
          control: JSON.stringify(signalId),
          input: JSON.stringify(input),
          runId,
          signalName,
          workflowId,
        },
      })
    } else {
      switch (signal.status) {
        case 'failed': {
          const error = new Error(
            `Failed to signal workflow execution: ${signal.cause}`
          )
          error.code = 'SignalExternalWorkflowExecutionFailed'
          error.cause = signal.cause
          error.timestamp = signal.failedAt

          return reject(error)
        }
        case 'sent': {
          return resolve(signal)
        }
        case 'cancelFailed': // this is for cancelTimer()        }
        case 'started': // we need to wait
        case 'canceled': // let's not resolve the promise
      }
    }
  })
}

module.exports = signalWorkflowExecution
