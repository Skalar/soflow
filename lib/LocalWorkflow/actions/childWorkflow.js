import {get} from 'lodash'
import Context from '~/lib/LocalWorkflow/Context'

function childWorkflow(name, params) {
  const {
    tasks,
    workflows,
    actions,
  } = this.soflow

  const workflow = workflows[name]

  const context = new Context({
    workflows,
    tasks,
    actions,
    config: get(workflow, 'config.LocalWorkflow'),
    ...params
  })

  return workflow(context)
}

export default childWorkflow
