const config = require('../../../../config')

module.exports = function({
  domain: name,
  domainDescription: description = 'soflow workflows',
  executionRetention = config.executionRetention,
}) {
  const swf = new config.AWS.SWF()

  return {
    async domain() {
      try {
        return await swf
          .registerDomain({
            name,
            workflowExecutionRetentionPeriodInDays: executionRetention.toString(),
            description,
          })
          .promise()
      } catch (error) {
        if (error.code !== 'DomainAlreadyExistsFault') {
          throw error
        }
        return {}
      }
    },
  }
}
