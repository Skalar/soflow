import AWS from 'aws-sdk'

const cloudWatchEvents = new AWS.CloudWatchEvents({region: process.env.AWS_DEFAULT_REGION})

export default function({
  namespace,
}) {
  return {
    async removeCloudWatchEventsRules() {
      let result

      while (!result || result.NextToken) {
        result = await cloudWatchEvents.listRules({
          NamePrefix: `${namespace}_`,
          ...(result && result.NextToken ? {NextToken: result.NextToken} : {})
        }
        ).promise()

        await Promise.all(
          result.Rules.map(
            async ({Name}) => {
              const {Targets} = await cloudWatchEvents.listTargetsByRule({
                Rule: Name,
              }).promise()

              if (Targets.length) {
                await cloudWatchEvents.removeTargets({
                  Rule: Name,
                  Ids: Targets.map(t => t.Id)
                }).promise()
              }

              return cloudWatchEvents.deleteRule({Name}).promise()
            }
          )
        )

        if (!result.NextToken) {
          break
        }
      }
    }
  }
}
