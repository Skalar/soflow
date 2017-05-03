import test from 'blue-tape'
import {LocalWorkflow} from '~/lib'
import * as workflows from './'
import * as tasks from '../tasks'

test('LocalWorkflow: Timers', async t => {
  const result = await LocalWorkflow.executeWorkflow({
    workflows,
    tasks,
    type: 'Timers',
  })

  t.equal(result, 'correct', 'handles running a timer')
})

test('LocalWorkflow: Timers can be cancelled', async t => {
  const result = await LocalWorkflow.executeWorkflow({
    workflows,
    tasks,
    type: 'CancelledTimers',
  })

  t.equal(result, 'correct', 'handles starting and cancelling a timer')
})
