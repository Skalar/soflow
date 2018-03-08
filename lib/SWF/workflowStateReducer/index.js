const activityTasks = require('./activityTasks')
const childWorkflows = require('./childWorkflows')
const lambdaFunctions = require('./lambdaFunctions')
const incomingSignals = require('./incomingSignals')
const timers = require('./timers')
const workflowExecution = require('./workflowExecution')

function workflowStateReducer(state = {}, events = []) {
  return {
    activityTasks: activityTasks(state.activityTasks, events),
    childWorkflows: childWorkflows(state.childWorkflows, events),
    lambdaFunctions: lambdaFunctions(state.lambdaFunctions, events),
    incomingSignals: incomingSignals(state.incomingSignals, events),
    timers: timers(state.timers, events),
    workflowExecution: workflowExecution(state.workflowExecution, events),
  }
}
module.exports = workflowStateReducer
