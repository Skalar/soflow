const config = require('../../../config')
const executeWorkflow = require('../../executeWorkflow')

async function shutdownDeciders({
  domain = config.swfDomain,
  namespace = config.namespace,
  version = config.workflowsVersion,
  taskList = `${namespace}_${version}`,
  // The current architecture allows for a maximum of 2 concurrent deciders.
  // Since we cannot get a list of running deciders, to ensure that all deciders
  // are shut down, we spawn 2 DeciderControl workflows - which time out if
  // there are no running decider(s) to receive them.
  numberOfDeciders = 2,
} = {}) {
  const promises = []

  for (let i = 0; i <= numberOfDeciders; i++) {
    try {
      const promise = executeWorkflow({
        domain,
        namespace,
        version: 'default',
        taskList,
        workflowId: `${taskList}_DeciderControl_${i}`,
        type: 'DeciderControl',
        scheduleToStartTimeout: 1,
        startToCloseTimeout: 2,
        scheduleToCloseTimeout: 3,
        input: {
          action: 'shutdown', // Currently ignored, but for future use when DeciderControl can do more things
        },
      })
      promises.push(promise)
    } catch (error) {
      console.dir({error}, {showHidden: false, depth: null})
    }
  }

  await Promise.all(promises)
  await new Promise(resolve => setTimeout(resolve, 2000))
}

module.exports = shutdownDeciders
