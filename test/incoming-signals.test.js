const testProfiles = require('./helpers/testProfiles')

testProfiles(
  'Incoming signals',
  async (t, {backend, executeWorkflow, prefix}) => {
    const execution = await executeWorkflow({
      type: 'IncomingSignals',
      workflowId: 'incoming-signals',
    })

    await backend.signalWorkflowExecution({
      prefixWorkflowId: false,
      workflowId: prefix('incoming-signals'),
      signalName: 'otherSignal',
      input: {my: 'otherPayload'},
    })

    await backend.signalWorkflowExecution({
      prefixWorkflowId: false,
      workflowId: prefix('incoming-signals'),
      signalName: 'testSignal',
      input: {my: 'payload'},
    })

    await backend.signalWorkflowExecution({
      prefixWorkflowId: false,
      workflowId: prefix('incoming-signals'),
      signalName: 'testSignal',
      input: {my: 'secondPayload'},
    })

    const result = await execution.promise

    t.pass('receives incoming signals')

    t.deepEqual(
      result.testSignal1.input,
      {my: 'payload'},
      '(first signal) payload includes input'
    )

    t.truthy(
      result.testSignal1.receivedAt,
      '(first signal) payload includes receivedAt'
    )

    t.deepEqual(
      result.testSignal2.input,
      {my: 'secondPayload'},
      '(second signal with different payload) payload includes input'
    )

    t.truthy(
      result.testSignal2.receivedAt,
      '(second signal with different payload) include receivedAt'
    )

    t.deepEqual(
      result.otherSignal1.input,
      {my: 'otherPayload'},
      '(other signal) payload includes input'
    )

    t.truthy(
      result.otherSignal1.receivedAt,
      '(other signal) payload includes receivedAt'
    )
  }
)
