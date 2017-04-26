import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: WithoutReturn', {timeout: 2000}, async t => {
  const result = await SWF.executeWorkflow({
    domain,
    namespace,
    id: 'SimpleMath',
    type: 'SimpleMath',
    version: 'integration_tests',
    input: 2.5,
  })

  t.equal(result, undefined, 'completes')
})