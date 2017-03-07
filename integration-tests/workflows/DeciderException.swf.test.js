import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: DeciderException', async t => {
  t.plan(3)

  await SWF.executeWorkflow({
    domain,
    namespace,
    id: 'DeciderException',
    type: 'DeciderException',
    version: 'integration_tests',
  }).catch(error => {
    t.pass('rejects promise')
    t.equal(error.name, 'Error', 'forwards the error name')
    t.equal(error.message, 'SomeFailure', 'forwards the error message')
  })
})
