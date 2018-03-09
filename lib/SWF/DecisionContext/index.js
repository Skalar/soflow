const get = require('lodash.get')
const defaultConfig = require('../../config')
const actions = require('./actions')
const path = require('path')

function safeRequire(path) {
  try {
    return require(path)
  } catch (error) {
    return {}
  }
}
class DecisionContext {
  constructor({
    codeRoot = defaultConfig.codeRoot,
    tasksPath = defaultConfig.tasksPath,
    workflowsPath = defaultConfig.workflowsPath,
    tasks: taskModules = safeRequire(path.join(codeRoot, tasksPath)),
    workflows: workflowModules = safeRequire(
      path.join(codeRoot, workflowsPath)
    ),
    state = {},
    input = state.workflowExecution ? state.workflowExecution.input : undefined,
    namespace,
    workflowType,
  }) {
    Object.assign(this, {
      namespace,
      decisions: [],
      state,
      counters: {},
      input,
      workflowType,
      workflowConfig:
        workflowModules[workflowType] && workflowModules[workflowType].config,
      taskModules,
      workflowModules,
    })

    this.counter = (...args) => {
      const key = args.join(':')

      if (typeof this.counters[key] === 'undefined') {
        return (this.counters[key] = 0)
      }

      return ++this.counters[key]
    }

    this.taskConfigs = Object.keys(taskModules).reduce(
      (configs, taskName) => ({
        ...configs,
        [taskName]: Object.assign(
          {},
          get(this.workflowConfig, 'tasks.default'),
          get(this.workflowConfig, ['tasks', taskName]),
          taskModules[taskName].config
        ),
      }),
      {}
    )
  }

  get actions() {
    return Object.keys(actions).reduce(
      (boundActions, actionName) => ({
        ...boundActions,
        [actionName]: (...args) => actions[actionName](this, ...args),
      }),
      {}
    )
  }

  get tasks() {
    return Object.keys(this.taskModules).reduce(
      (taskProxies, taskName) => ({
        ...taskProxies,
        [taskName]: (...args) => {
          return this.actions.task({
            name: taskName,
            args,
          })
        },
      }),
      {}
    )
  }

  get workflows() {
    return Object.keys(this.workflowModules).reduce(
      (workflowWrappers, workflowName) => ({
        ...workflowWrappers,
        [workflowName]: params => {
          return this.actions.childWorkflow({...params, type: workflowName})
        },
      }),
      {}
    )
  }
}

module.exports = DecisionContext
