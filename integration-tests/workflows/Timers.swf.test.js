import test from 'blue-tape'
import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
} = process.env

test('SWF: Timers', async t => {
  const result = await SWF.executeWorkflow({
    domain,
    namespace,
    workflowId: 'Timers',
    type: 'Timers',
    version: 'integration_tests',
  })

  t.equal(result, 'correct', 'handles running a timer')
})

test('SWF: Timers can be cancelled', async t => {
  const result = await SWF.executeWorkflow({
    domain,
    namespace,
    workflowId: 'CancelledTimers',
    type: 'CancelledTimers',
    version: 'integration_tests',
  })

  t.equal(result, 'correct', 'handles starting and cancelling a timer')
})
