import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: ChildWorkflows', async t => {
  const result = await SWF.executeWorkflow({
    domain,
    namespace,
    workflowId: 'ChildWorkflows',
    type: 'ChildWorkflows',
    version: 'integration_tests'
  })

  t.deepEqual(
    result,
    {firstResult: 20, secondResult: 8},
    'successfully executes child workflows'
  )
})
