import AWS from 'aws-sdk'

const cloudWatchLogs = new AWS.CloudWatchLogs({region: process.env.AWS_DEFAULT_REGION})

export default function({
  namespace,
}) {
  return {
    async removeCloudWatchLogGroups() {
      let result

      while (!result || result.nextToken) {
        result = await cloudWatchLogs.describeLogGroups({
          logGroupNamePrefix: `/aws/lambda/${namespace}_`,
          ...(result && result.nextToken ? {nextToken: result.nextToken} : {})
        }
        ).promise()

        await Promise.all(
          result.logGroups.map(
            ({logGroupName}) => cloudWatchLogs.deleteLogGroup({logGroupName}).promise()
          )
        )

        if (!result.nextToken) {
          break
        }
      }
    }
  }
}
