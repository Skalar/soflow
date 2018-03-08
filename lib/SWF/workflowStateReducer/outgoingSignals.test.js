const test = require('ava')
const outgoingSignals = require('./outgoingSignals')

test('no outgoing signals', async t => {
  const state = outgoingSignals()

  t.deepEqual(
    state,
    {},
    'returns an empty object when no state and events provided'
  )
})

test('initiated', async t => {
  const state = outgoingSignals(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01'),
      eventType: 'SignalExternalWorkflowExecutionInitiated',
      signalExternalWorkflowExecutionInitiatedEventAttributes: {
        control: 'signalId',
        signalName: 'testSignal',
        input: JSON.stringify({my: 'data'}),
        workflowId: 'otherWorkflow',
        runId: '010101',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      otherWorkflow_010101_testSignal_signalId: {
        initiatedAt: new Date('2018-01-01'),
        initiatedEventId: 1,
        input: {my: 'data'},
        runId: '010101',
        workflowId: 'otherWorkflow',
        status: 'initiated',
      },
    },
    'initiated'
  )
})

test('failed', async t => {
  const state = outgoingSignals(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01'),
      eventType: 'SignalExternalWorkflowExecutionInitiated',
      signalExternalWorkflowExecutionInitiatedEventAttributes: {
        control: 'signalId',
        signalName: 'testSignal',
        input: JSON.stringify({my: 'data'}),
        workflowId: 'otherWorkflow',
        runId: '010101',
      },
    },
    {
      eventId: 2,
      eventTimestamp: new Date('2018-01-02'),
      eventType: 'SignalExternalWorkflowExecutionFailed',
      signalExternalWorkflowExecutionFailedEventAttributes: {
        control: 'signalId',
        cause: 'OPERATION_NOT_PERMITTED',
        initiatedEventId: 1,
        workflowId: 'otherWorkflow',
        runId: '010101',
      },
    },
  ])

  t.deepEqual(
    state,
    {
      otherWorkflow_010101_testSignal_signalId: {
        initiatedAt: new Date('2018-01-01'),
        initiatedEventId: 1,
        status: 'failed',
        failedAt: new Date('2018-01-02'),
        cause: 'OPERATION_NOT_PERMITTED',
        input: {my: 'data'},
        runId: '010101',
        workflowId: 'otherWorkflow',
      },
    },
    'failed'
  )
})

test('sent', async t => {
  const state = outgoingSignals(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01'),
      eventType: 'SignalExternalWorkflowExecutionInitiated',
      signalExternalWorkflowExecutionInitiatedEventAttributes: {
        control: 'signalId',
        signalName: 'testSignal',
        input: JSON.stringify({my: 'data'}),
        workflowId: 'otherWorkflow',
        runId: '010101',
      },
    },
    {
      eventId: 2,
      eventTimestamp: new Date('2018-01-02'),
      eventType: 'ExternalWorkflowExecutionSignaled',
      externalWorkflowExecutionSignaledEventAttributes: {
        initiatedEventId: 1,
        workflowExecution: {
          workflowId: 'otherWorkflow',
          runId: '010101',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      otherWorkflow_010101_testSignal_signalId: {
        initiatedAt: new Date('2018-01-01'),
        initiatedEventId: 1,
        status: 'sent',
        sentAt: new Date('2018-01-02'),
        input: {my: 'data'},
        runId: '010101',
        workflowId: 'otherWorkflow',
      },
    },
    'sent'
  )
})
