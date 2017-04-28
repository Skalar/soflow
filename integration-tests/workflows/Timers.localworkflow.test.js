import test from 'blue-tape'
import {LocalWorkflow} from '~/lib'
import * as workflows from './'
import * as tasks from '../tasks'

test('LocalWorkflow: Timers', async t => {
  const result = await LocalWorkflow.executeWorkflow({
    workflows,
    tasks,
    name: 'Timers', // TODO: change to type?
  })

  t.equal(result, 'correct', 'handles starting and canceling timers')
})
