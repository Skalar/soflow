import Context from './Context'
import {get} from 'lodash'
import * as actions from './actions'

async function executeWorkflow({
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

  return workflow(context)
}


export default executeWorkflow
