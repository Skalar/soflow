import test from 'blue-tape'
import AWS from 'aws-sdk'
import {SWF} from '~/lib'

const swf = new AWS.SWF({region: 'eu-west-1'})

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

function sendSignal(workflowId, input) {
  const params = {
    domain,
    signalName: 'receiveSignalTest',
    workflowId,
    input: JSON.stringify(input),
  }

  return new Promise((resolve, reject) => {
    swf.signalWorkflowExecution(params, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

test('SWF: ReceiveSignal', async t => {
  t.timeoutAfter(7000)
  t.plan(1)

  const testData = {testdata: 10}
  const workflowId = 'ReceiveSignal'

  const promise = SWF.executeWorkflow({
    domain,
    namespace,
    id: workflowId,
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
    id: workflowId,
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
