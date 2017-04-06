import * as actions from './actions'

function Context(data) {
  const {
    input,
    tasks = {},
    workflows = {},
  } = data


  const context = {
    data,
    _timers: {},
    input,
  }

  context.actions = Object.keys(actions).reduce(
    (boundActions, actionName) => ({
      ...boundActions,
      [actionName]: actions[actionName].bind(context)
    }),
    {}
  )

  context.tasks = Object.keys(tasks).reduce(
    (taskWrappers, taskName) => ({
      ...taskWrappers,
      [taskName](...args) {
        return context.actions.runTask(taskName, args)
      }
    }),
    {}
  )

  context.workflows = Object.keys(workflows).reduce(
    (workflowWrappers, workflowName) => ({
      ...workflowWrappers,
      [workflowName](...args) {
        return context.actions.childWorkflow(workflowName, args)
      }
    }),
    {}
  )


  return context
}

export default Context
