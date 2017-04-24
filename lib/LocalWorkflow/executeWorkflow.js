import Context from './Context'
import {get} from 'lodash'
import * as actions from './actions'

async function executeWorkflow({
  workflows = {},
  input,
  tasks,
  name,
}) {
  const workflow = workflows[name]

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
