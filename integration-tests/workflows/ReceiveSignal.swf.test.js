import test from 'blue-tape'
import AWS from 'aws-sdk'
import {SWF} from '~/lib'

const swf = new AWS.SWF({region: 'eu-west-1'})

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: ReceiveSignal', async t => {
  t.plan(1)

  const testData = {testdata: 10}
  const workflowId = 'ReceiveSignal'

  const promise = SWF.executeWorkflow({
    domain,
    namespace,
    id: workflowId,
    type: 'ReceiveSignal',
    version: 'integration_tests',
    executionStartToCloseTimeout: 300,
    input: null,
  })
  .then(result => {
    t.deepEqual(result, testData, 'completes with the correct result')
  })

  const params = {
    domain,
    signalName: 'receiveSignalTest',
    workflowId,
    input: JSON.stringify(testData),
  }
  setTimeout(() => {
    // We use a timeout to give SWF time to start the workflow before sending a signal
    swf.signalWorkflowExecution(params, function(err) {
      if (err) {
        console.log(err, err.stack)
        t.fail(err.msg)
      }
    })
  }, 1000)

  return promise
})
