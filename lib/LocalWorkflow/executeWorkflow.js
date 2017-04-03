import Context from './Decider/Context'

async function executeWorkflow({
  workflow,
  input,
  tasks,
  childWorkflows,
  tasksConfig,
}) {
  const context = new Context({
    input,
    childWorkflows,
    tasks,
    tasksConfig
  })

  return workflow(context)
}


export default executeWorkflow
