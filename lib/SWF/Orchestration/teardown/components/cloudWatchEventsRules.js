const config = require('../../../../config')

module.exports = function({namespace}) {
  const cloudWatchEvents = new config.AWS.CloudWatchEvents()

  return {
    async removeCloudWatchEventsRules() {
      let result

      while (!result || result.NextToken) {
        result = await cloudWatchEvents
          .listRules({
            NamePrefix: `${namespace}`,
            ...(result && result.NextToken
              ? {NextToken: result.NextToken}
              : {}),
          })
          .promise()

        await Promise.all(
          result.Rules.map(async ({Name}) => {
            const {Targets} = await cloudWatchEvents
              .listTargetsByRule({
                Rule: Name,
              })
              .promise()

            if (Targets.length) {
              await cloudWatchEvents
                .removeTargets({
                  Rule: Name,
                  Ids: Targets.map(t => t.Id),
                })
                .promise()
            }

            return cloudWatchEvents.deleteRule({Name}).promise()
          })
        )

        if (!result.NextToken) {
          break
        }
      }
    },
  }
}
