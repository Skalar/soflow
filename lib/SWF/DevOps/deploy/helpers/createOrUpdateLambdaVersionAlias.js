import AWS from 'aws-sdk'
const lambda = new AWS.Lambda({region: process.env.AWS_DEFAULT_REGION})

async function createOrUpdateLambdaVersionAlias({
  functionName: FunctionName,
  functionVersion: FunctionVersion,
  name: Name,
}) {
  try {
    return await lambda.createAlias({FunctionName, FunctionVersion, Name}).promise()
  }
  catch (error) {
    if (error.code !== 'ResourceConflictException') throw error
  }

  return lambda.updateAlias({FunctionName, FunctionVersion, Name}).promise()
}

export default createOrUpdateLambdaVersionAlias
