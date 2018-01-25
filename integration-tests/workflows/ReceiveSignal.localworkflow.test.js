import test from 'blue-tape'
import {LocalWorkflow} from '~/lib'
import * as workflows from './'
import * as tasks from '../tasks'

function sendSignal(workflowId, input) {
  const params = {
    signalName: 'receiveSignalTest',
    workflowId,
    input,
  }

  return LocalWorkflow.signalWorkflowExecution(params)
}

test('LocalWorkflow: ReceiveSignal', async t => {
  t.timeoutAfter(1000)
  t.plan(1)

  const testData = {testdata: 10}
  const workflowId = 'ReceiveSignal'

  const promise = LocalWorkflow.executeWorkflow({
    workflowId,
    workflows,
    tasks,
    type: 'ReceiveSignal',
  })
  .then(result => {
    t.deepEqual(result, testData, 'completes with the correct result')
  })

  setTimeout(() => {
    // We use a timeout to give time to start the workflow before sending a signal
    sendSignal(workflowId, testData)
      .catch(err => {
        t.fail(err.msg)
      })
  }, 50)

  return promise
})

test('LocalWorkflow: ReceiveSignal multiple times with the same signal name', async t => {
  t.timeoutAfter(2000)
  t.plan(1)

  const testData = [10, 'foo']
  const workflowId = 'ReceiveSignalMultipleTimes'

  const promise = LocalWorkflow.executeWorkflow({
    workflowId,
    workflows,
    tasks,
    type: 'ReceiveSignalMultipleTimes',
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
  }, 50)

  return promise
})
