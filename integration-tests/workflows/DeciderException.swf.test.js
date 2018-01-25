import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: DeciderException', async t => {
  t.timeoutAfter(7000)
  t.plan(3)

  await SWF.executeWorkflow({
    domain,
    namespace,
    workflowId: 'DeciderException',
    type: 'DeciderException',
    version: 'integration_tests',
    executionStartToCloseTimeout: 5,
  }).catch(error => {
    t.pass('rejects promise')
    t.equal(error.name, 'Error', 'forwards the error name')
    t.equal(error.message, 'SomeFailure', 'forwards the error message')
  })
})
