const config = require('../../../../config')

module.exports = function({namespace}) {
  const cloudWatchLogs = new config.AWS.CloudWatchLogs()

  return {
    removeCloudWatchLogGroups: [
      'removeIamRoles',
      'removeCloudWatchEventsRules',
      'removeLambdaFunctions',
      async () => {
        let result

        while (!result || result.nextToken) {
          result = await cloudWatchLogs
            .describeLogGroups({
              logGroupNamePrefix: `/aws/lambda/${namespace}`,
              ...(result && result.nextToken
                ? {nextToken: result.nextToken}
                : {}),
            })
            .promise()

          for (const {logGroupName} of result.logGroups) {
            await cloudWatchLogs.deleteLogGroup({logGroupName}).promise()
          }
        }
      },
    ],
  }
}
