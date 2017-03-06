import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SoFlow.SWF / Basic workflow', async t => {
  const result = await SWF.executeWorkflow({
    domain,
    namespace,
    id: 'soflow-integration-tests',
    type: 'SimpleMath',
    version: 'integration_tests',
    input: 2.5,
  })

  t.equal(result, 10, 'completes with the correct result')
})
