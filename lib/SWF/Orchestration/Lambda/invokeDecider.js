const config = require('../../../config')

async function invokeDecider({
  namespace = config.namespace,
  version = config.workflowsVersion,
  taskList = `${namespace}_${version}`,
} = {}) {
  const lambda = new config.AWS.Lambda()
  const result = await lambda
    .invoke({
      FunctionName: `${namespace}_decider:${version}`,
      InvocationType: 'Event',
      Payload: JSON.stringify({taskList}),
    })
    .promise()
  return result
}

module.exports = invokeDecider
