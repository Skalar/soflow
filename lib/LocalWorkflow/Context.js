function Context({
  input,
  tasks = {},
  workflows = {},
  actions = {},
}) {
  const context = {
    input,
    soflow: {
      tasks,
      workflows,
      actions,
      timers: {},
    },
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
      [workflowName](params) {
        return context.actions.childWorkflow(workflowName, params)
      }
    }),
    {}
  )


  return context
}

export default Context
