import Context from '~/lib/LocalWorkflow/Decider/Context'

function childWorkflow(name, params) {
  const {
    input,
    tasks,
    workflows,
    tasksConfig,
  } = this.data

  const context = new Context({
    workflows,
    tasks,
    tasksConfig,
    ...params
  })

  return workflows[name](context)
}

export default childWorkflow
