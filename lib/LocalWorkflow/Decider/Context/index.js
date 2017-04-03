import * as actions from './actions'

function Context({input, childWorkflows, tasks, tasksConfig}) {
  const context = {
    childWorkflows,
    _tasks: tasks,
    input,
    tasksConfig,
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
        return context.actions.runTask(taskName, args)
      }
    }),
    {}
  )

  return context
}

export default Context
