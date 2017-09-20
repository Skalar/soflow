import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

function sendSignal(workflowId, input) {
  const params = {
    domain,
    signalName: 'receiveSignalTest',
    workflowId,
    input,
  }

  return SWF.signalWorkflowExecution(params)
}

test('SWF: ReceiveSignal', async t => {
  t.timeoutAfter(7000)
  t.plan(1)

  const testData = {testdata: 10}
  const workflowId = 'ReceiveSignal'

  const promise = SWF.executeWorkflow({
    domain,
    namespace,
    workflowId,
    type: 'ReceiveSignal',
    version: 'integration_tests',
    executionStartToCloseTimeout: 5,
    input: null,
  })
  .then(result => {
    t.deepEqual(result, testData, 'completes with the correct result')
  })

  setTimeout(() => {
    // We use a timeout to give SWF time to start the workflow before sending a signal
    sendSignal(workflowId, testData)
      .catch(err => {
        t.fail(err.msg)
      })
  }, 1000)

  return promise
})

test('SWF: ReceiveSignal multiple times with the same signal name', async t => {
  t.timeoutAfter(7000)
  t.plan(1)

  const testData = [10, 'foo']
  const workflowId = 'ReceiveSignalMultipleTimes'

  const promise = SWF.executeWorkflow({
    domain,
    namespace,
    workflowId,
    type: 'ReceiveSignalMultipleTimes',
    version: 'integration_tests',
    executionStartToCloseTimeout: 5,
    input: null,
  })
  .then(result => {
    t.deepEqual(result, testData, 'completes with the correct result')
  })

  setTimeout(() => {
    // We use a timeout to give SWF time to start the workflow before sending a signal
    sendSignal(workflowId, testData[0])
      .then(() => {
        return sendSignal(workflowId, testData[1])
      })
      .catch(err => {
        t.fail(err.msg)
      })
  }, 1000)

  return promise
})
