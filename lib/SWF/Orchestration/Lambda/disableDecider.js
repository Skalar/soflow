const config = require('../../../config')
const awsName = require('../../awsName')

module.exports = async function disableDecider({
  namespace = config.namespace,
  workflowsVersion = config.workflowsVersion,
} = {}) {
  const cloudwatchevents = new config.AWS.CloudWatchEvents()
  await cloudwatchevents
    .disableRule({
      Name: awsName.rule(
        `${namespace}_deciderCloudWatchEventRule_${workflowsVersion}`
      ),
    })
    .promise()
}
