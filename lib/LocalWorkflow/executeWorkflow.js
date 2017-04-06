import Context from './Decider/Context'

async function executeWorkflow({
  workflows = {},
  input,
  tasks,
  tasksConfig,
  name,
}) {
  const context = new Context({
    workflows,
    tasks,
    tasksConfig,
    input,
  })

  const workflow = workflows[name]

  return workflow(context)
}


export default executeWorkflow
