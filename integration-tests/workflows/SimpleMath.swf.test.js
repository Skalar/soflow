import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: SimpleMath', async t => {
  t.timeoutAfter(7000)

  const result = await SWF.executeWorkflow({
    domain,
    namespace,
    id: 'SimpleMath',
    type: 'SimpleMath',
    version: 'integration_tests',
    executionStartToCloseTimeout: 5,
    input: 2.5,
  })

  t.equal(result, 10, 'completes with the correct result')
})
