const WorkflowExecutions = require('../../WorkflowExecutions')

async function childWorkflow(context, {input, id, type} = {}) {
  if (WorkflowExecutions[id]) {
    throw new Error(`There is already an active workflow with id = ${id}`)
  }

  const childContext = context.createChildContext({
    input,
  })

  const workflow = context.workflowModules[type]

  if (!workflow) {
    throw new Error(`Unknown workflow type: ${type}`)
  }

  try {
    WorkflowExecutions[id] = childContext
    return await workflow(childContext)
  } finally {
    delete WorkflowExecutions[id]
  }
}

module.exports = childWorkflow
