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
    state = {timers: {}, incomingSignals: {}, incomingSignalListeners: {}},
    workflowId,
    input,
    codeRoot = defaultConfig.codeRoot,
    tasksPath = defaultConfig.tasksPath,
    workflowsPath = defaultConfig.workflowsPath,
    tasks: taskModules = safeRequire(path.join(codeRoot, tasksPath)),
    workflows: workflowModules = safeRequire(
      path.join(codeRoot, workflowsPath)
    ),
    workflowType,
  }) {
    Object.assign(this, {
      input: input && JSON.parse(JSON.stringify(input)),
      workflowId,
      state,
      config: {
        codeRoot,
        tasksPath,
        workflowsPath,
      },
      workflowType,
      workflowConfig:
        workflowModules[workflowType] && workflowModules[workflowType].config,
      taskModules,
      workflowModules,
    })

    this.taskConfigs = Object.keys(taskModules).reduce(
      (configs, taskName) => ({
        [taskName]: Object.assign(
          {},
          taskModules[taskName].config,
          get(this.workflowConfig, 'tasks.default'),
          get(this.workflowConfig, ['tasks', taskName])
        ),
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

  get actions() {
    return Object.keys(actions).reduce(
      (boundActions, actionName) => ({
        ...boundActions,
        [actionName]: (...args) => actions[actionName](this, ...args),
      }),
      {}
    )
  }

  // Private

  awaitSignal(signalName) {
    const {incomingSignals, incomingSignalListeners} = this.state
    const promise = new Promise(resolve => {
      if (!incomingSignalListeners[signalName]) {
        incomingSignalListeners[signalName] = []
      }
      incomingSignalListeners[signalName].push(resolve)
      const receivedSignal =
        incomingSignals[signalName] && incomingSignals[signalName].shift()
      if (receivedSignal) {
        resolve(receivedSignal)
      }
    })

    return promise
  }

  registerIncomingSignal(signalName, data) {
    const {incomingSignals, incomingSignalListeners} = this.state
    if (!incomingSignals[signalName]) {
      incomingSignals[signalName] = []
    }
    incomingSignals[signalName].push({
      input: data,
      receivedAt: new Date().toISOString(),
    })
    const awaitingListener =
      incomingSignalListeners[signalName] &&
      incomingSignalListeners[signalName].shift()

    if (awaitingListener) {
      awaitingListener(incomingSignals[signalName].shift())
    }
  }

  createChildContext(params) {
    const {taskModules, workflowModules} = this
    return new this.constructor({
      ...params,
      ...this.config,
      workflows: workflowModules,
      tasks: taskModules,
    })
  }
}

module.exports = DecisionContext
