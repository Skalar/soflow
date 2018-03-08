const test = require('ava')
const signalWorkflowExecution = require('./signalWorkflowExecution')
const {brieflyWaitForPromise} = require('soflow/test')
const DecisionContext = require('../')

test('not initiated', async t => {
  const context = new DecisionContext({
    namespace: 'test',
    state: {
      outgoingSignals: {},
    },
  })

  const {error, result} = await brieflyWaitForPromise(
    signalWorkflowExecution(context, {
      signalName: 'mySignal',
      workflowId: 'myOtherWorkflow',
      runId: '010101',
      input: {my: 'data'},
    })
  )

  t.is(error, undefined, 'promise is not rejected')
  t.is(result, undefined, 'promise does not resolve')
  t.deepEqual(
    context.decisions,
    [
      {
        decisionType: 'SignalExternalWorkflowExecution',
        signalExternalWorkflowExecutionDecisionAttributes: {
          control: '0',
          input: JSON.stringify({my: 'data'}),
          runId: '010101',
          signalName: 'mySignal',
          workflowId: 'test_myOtherWorkflow',
        },
      },
    ],
    'makes decision to signal external workflow execution'
  )
})

test('initiated', async t => {
  const context = new DecisionContext({
    namespace: 'test',
    state: {
      outgoingSignals: {
        test_myOtherWorkflow_010101_mySignal_0: {
          initiatedAt: new Date('2018-01-01'),
          status: 'initiated',
          input: {my: 'data'},
          runId: '010101',
          workflowId: 'test_myOtherWorkflow',
        },
      },
    },
  })

  const {error, result} = await brieflyWaitForPromise(
    signalWorkflowExecution(context, {
      signalName: 'mySignal',
      workflowId: 'myOtherWorkflow',
      runId: '010101',
      input: {my: 'data'},
    })
  )

  t.is(error, undefined, 'promise is not rejected')
  t.is(result, undefined, 'promise does not resolve')
  t.deepEqual(context.decisions, [], 'makes no decisions')
})

test('failed', async t => {
  const context = new DecisionContext({
    namespace: 'test',
    state: {
      outgoingSignals: {
        test_myOtherWorkflow_010101_mySignal_0: {
          initiatedAt: new Date('2018-01-01'),
          status: 'failed',
          failedAt: new Date('2018-01-02'),
          cause: 'OPERATION_NOT_PERMITTED',
          input: {my: 'data'},
          runId: '010101',
          workflowId: 'test_myOtherWorkflow',
        },
      },
    },
  })

  const {error, result} = await brieflyWaitForPromise(
    signalWorkflowExecution(context, {
      signalName: 'mySignal',
      workflowId: 'myOtherWorkflow',
      runId: '010101',
      input: {my: 'data'},
    })
  )

  t.deepEqual(context.decisions, [], 'makes no decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, undefined, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: Failed to signal workflow execution: OPERATION_NOT_PERMITTED',
    'provides a sensible rejection error message'
  )
  t.is(error.cause, 'OPERATION_NOT_PERMITTED', 'error has "cause" property')
  t.is(
    error.code,
    'SignalExternalWorkflowExecutionFailed',
    'error has "code" property'
  )
  t.deepEqual(
    error.timestamp,
    new Date('2018-01-02'),
    'error has "timestamp" property'
  )
})

test('sent', async t => {
  const context = new DecisionContext({
    namespace: 'test',
    state: {
      outgoingSignals: {
        test_myOtherWorkflow_010101_mySignal_0: {
          initiatedAt: new Date('2018-01-01'),
          status: 'sent',
          sentAt: new Date('2018-01-02'),
          input: {my: 'data'},
          runId: '010101',
          workflowId: 'test_myOtherWorkflow',
        },
      },
    },
  })

  const {error, result} = await brieflyWaitForPromise(
    signalWorkflowExecution(context, {
      signalName: 'mySignal',
      workflowId: 'myOtherWorkflow',
      runId: '010101',
      input: {my: 'data'},
    })
  )

  t.deepEqual(context.decisions, [], 'makes no decisions')
  t.is(error, undefined, 'promise is not rejected')
  t.truthy(result, undefined, 'promise is resolved')
  t.deepEqual(
    result,
    {
      initiatedAt: new Date('2018-01-01'),
      status: 'sent',
      sentAt: new Date('2018-01-02'),
      input: {my: 'data'},
      runId: '010101',
      workflowId: 'test_myOtherWorkflow',
    },
    'resolves with the signal information'
  )
})
