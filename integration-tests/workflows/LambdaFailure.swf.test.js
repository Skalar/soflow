import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: LambdaFailure', async t => {
  t.plan(3)

  await SWF.executeWorkflow({
    domain,
    namespace,
    id: 'LambdaFailure',
    type: 'LambdaFailure',
    version: 'integration_tests',
  }).catch(error => {
    t.pass('rejects promise')
    t.equal(error.name, 'Error', 'uses the correct error name')
    t.equal(error.message, 'Damn', 'uses the correct error message')
  })
})
