const config = require('../../../config')

async function createOrUpdateLambdaVersionAlias({
  functionName: FunctionName,
  functionVersion: FunctionVersion,
  name: Name,
}) {
  const lambda = new config.AWS.Lambda()

  try {
    return await lambda
      .createAlias({FunctionName, FunctionVersion, Name})
      .promise()
  } catch (error) {
    if (error.code !== 'ResourceConflictException') throw error
  }

  return lambda.updateAlias({FunctionName, FunctionVersion, Name}).promise()
}

module.exports = createOrUpdateLambdaVersionAlias
