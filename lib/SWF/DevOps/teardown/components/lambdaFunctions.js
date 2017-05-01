import AWS from 'aws-sdk'

const lambda = new AWS.Lambda({region: process.env.AWS_DEFAULT_REGION})

export default function({
  namespace,
}) {
  return {
    async removeLambdaFunctions() {
      let result

      while (!result || result.NextMarker) {
        result = await lambda.listFunctions(
          result && result.NextMarker ? {Marker: result.NextMarker} : {}
        ).promise()

        await Promise.all(
          result.Functions.filter(
            ({FunctionName}) => FunctionName.startsWith(`${namespace}_`)
          ).map(
            ({FunctionName}) => lambda.deleteFunction({FunctionName}).promise()
          )
        )

        if (!result.NextMarker) {
          break
        }
      }
    }
  }
}
