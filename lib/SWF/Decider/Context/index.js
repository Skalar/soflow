import * as actions from './actions'
import WorkflowHistory from '~/lib/SWF/WorkflowHistory'

export default function DeciderContext({workflows, tasks, events, version, namespace}) {
  const context = {
    workflows,
    tasks,
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

  context.lambdaFunctions = Object.keys(tasks).reduce(
    (taskProxies, taskName) => ({
      ...taskProxies,
      [taskName](...args) {
        return context.actions.lambdaFunction(taskName, args)
      }
    }),
    {}
  )

  context.activityTasks = Object.keys(tasks).reduce(
    (taskProxies, taskName) => ({
      ...taskProxies,
      [taskName](...args) {
        return context.actions.activityTask(taskName, args)
      }
    }),
    {}
  )


  context.state = WorkflowHistory(events)
  context.input = context.state.workflowExecution.input

  return context
}
