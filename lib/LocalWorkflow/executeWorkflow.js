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
  let result
  try {
    result = await workflow(context)
  } catch (e) {
    markAsFailed(workflowId)
    throw e
  }
  markAsComplete(workflowId)
  return result
}


export default executeWorkflow
