const config = require('../../../../config')

module.exports = function({namespace}) {
  const lambda = new config.AWS.Lambda()

  return {
    async removeLambdaFunctions() {
      let result

      while (!result || result.NextMarker) {
        result = await lambda
          .listFunctions(
            result && result.NextMarker ? {Marker: result.NextMarker} : {}
          )
          .promise()

        await Promise.all(
          result.Functions.filter(
            ({FunctionName, Description}) =>
              FunctionName.startsWith(namespace) &&
              Description.startsWith('soflow')
          ).map(({FunctionName}) =>
            lambda.deleteFunction({FunctionName}).promise()
          )
        )

        if (!result.NextMarker) {
          break
        }
      }
    },
  }
}
