import * as actions from './actions'
import {get} from 'lodash'
import WorkflowHistory from '~/lib/SWF/WorkflowHistory'

export default function DeciderContext({
  workflows,
  tasks,
  events,
  version,
  namespace,
  config,
}) {
  const context = {
    soflow: {
      tasks,
      workflows,
    },
    version,
    namespace,
    decisions: [],
    ref: 0,
  }

  context.actions = Object.keys(actions).reduce(
    (boundActions, actionName) => ({
      ...boundActions,
      [actionName]: actions[actionName].bind(context)
    }),
    {}
  )

  context.tasks = Object.keys(tasks).reduce(
    (taskProxies, taskName) => ({
      ...taskProxies,
      [taskName](...args) {
        const taskType = get(config, `tasks.${taskName}.type`)
          || get(config, 'tasks.default.type')
          || 'lambda'

        if (taskType === 'lambda') {
          return context.actions.lambdaFunction(taskName, args)
        }
        else if (taskType === 'activityTask') {
          return context.actions.activityTask(taskName, args)
        }

        throw new Error(`Unknown task type: '${taskType}'`)
      }
    }),
    {}
  )

  context.workflows = Object.keys(workflows).reduce(
    (workflowWrappers, workflowName) => ({
      ...workflowWrappers,
      [workflowName](params) {
        return context.actions.childWorkflow({...params, type: workflowName})
      }
    }),
    {}
  )

  context.state = WorkflowHistory(events)
  context.input = context.state.workflowExecution.input

  return context
}
