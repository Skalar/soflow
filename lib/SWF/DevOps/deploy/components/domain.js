import AWS from 'aws-sdk'
const swf = new AWS.SWF({region: process.env.AWS_DEFAULT_REGION})

export default function({
  teardown,
  domain: name,
  domainDescription: description = 'SoFlow workflows',
  workflowExecutionRetentionPeriodInDays = 1,
}) {
  return {
    async domain() {
      if (teardown) return null

      try {
        return await swf.registerDomain({
          name,
          workflowExecutionRetentionPeriodInDays: workflowExecutionRetentionPeriodInDays.toString(),
          description,
        }).promise()
      }
      catch (error) {
        if (error.code !== 'DomainAlreadyExistsFault') {
          throw error
        }
        return {}
      }
    }
  }
}
