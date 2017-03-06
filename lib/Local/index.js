import * as actions from './actions'

async function executeWorkflow({workflows, tasks, name, input}) {
  // console.log('execute', workflowName, input)
  const workflow = workflows[name]

  const context = {
    workflows,
    tasks,
    blocks: [],
  }

  context.executeWorkflow = executeWorkflow.bind(context)

  const boundActions = Object.keys(actions).reduce(
    (boundActions, actionName) => ({
      ...boundActions,
      [actionName]: actions[actionName].bind(context)
    }),
    {}
  )

  const tasksProxy = new Proxy({}, {
    get: (target, name) => {
      function taskFunction(...args) {
        return boundActions.runTask(name, args)
      }

      return taskFunction
    }
  })

  return workflow(input, tasksProxy, actions)
}

class Local {
  constructor(workflows, tasks) {
    this.workflows = workflows
    this.tasks = tasks
  }

  // async executeWorkflow(name, input) {
  //   // executeWorkflow
  // }
}

Local.executeWorkflow = executeWorkflow

export default Local

export {executeWorkflow}

// TODO må via map resolve om det er activity task eller lambda
// TODO heartbeat funksjon for task (tillater kansellering)
