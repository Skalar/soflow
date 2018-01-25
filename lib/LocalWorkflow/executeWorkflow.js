import uuid from 'uuid'
import Context from './Context'
import {register, markAsFailed, markAsComplete} from './StoreContext'
import {get} from 'lodash'
import * as actions from './actions'

async function executeWorkflow({
  workflowId = 'none-provided',
  workflows = {},
  input,
  tasks,
  type,
  waitForCompletion = true,
}) {
  const workflow = workflows[type]

  const context = new Context({
    workflows,
    tasks,
    input,
    actions,
    config: get(workflow, 'config.LocalWorkflow')
  })

  register(workflowId, context)

  const execution = workflow(context)

  execution.then(() => {
    markAsComplete(workflowId)
  }).catch(() => {
    markAsFailed(workflowId)
  })

  if (waitForCompletion) {
    return await execution
  }
  return {
    runId: uuid()
  }
}

export default executeWorkflow
