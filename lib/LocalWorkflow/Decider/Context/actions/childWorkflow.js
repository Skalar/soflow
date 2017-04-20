function childWorkflow(name, params) {
  const {
    tasks,
    workflows,
    tasksConfig,
  } = this.data

  // We can not use an import statement at the top of this file since then a
  // circular dependency will be created. Normally this kind of problem would be
  // resolved by injecting the Context to this module, but since this is the
  // only action that needs it this hack is probably a lot cleaner.
  const Context = require('~/lib/LocalWorkflow/Decider/Context').default
  const context = new Context({
    workflows,
    tasks,
    tasksConfig,
    ...params
  })

  return workflows[name](context)
}

export default childWorkflow
