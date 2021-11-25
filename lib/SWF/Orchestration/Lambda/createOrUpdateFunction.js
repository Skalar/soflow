const config = require('../../../config')

async function createOrUpdateLambdaFunction({
  code: Code,
  description,
  functionName: FunctionName,
  handler: Handler,
  memorySize: MemorySize,
  role: Role,
  runtime: Runtime,
  timeout: Timeout,
  environment,
}) {
  const lambda = new config.AWS.Lambda()

  const Environment = {Variables: environment}

  let existingFunction, lastError

  try {
    existingFunction = await lambda.getFunction({FunctionName}).promise()
  } catch (error) {
    if (error.code !== 'ResourceNotFoundException') {
      throw error
    }
  }

  if (existingFunction) {
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const {S3Bucket, S3Key} = Code
        const {Version} = await lambda
          .updateFunctionCode({
            FunctionName,
            Publish: true,
            S3Bucket,
            S3Key,
          })
          .promise()

        await lambda.waitFor('functionUpdated', {FunctionName}).promise()

        const configuration = await lambda
          .updateFunctionConfiguration({
            FunctionName,
            Description: `soflow: ${description}`,
            Handler,
            KMSKeyArn: '',
            MemorySize,
            Role,
            Runtime,
            Timeout,
            Environment,
          })
          .promise()

        return {...configuration, Version}
      } catch (error) {
        if (error.code === 'TooManyRequestsException') {
          await new Promise(resolve =>
            setTimeout(resolve, Math.random() * 2000)
          )
        } else if (
          (error.code === 'InvalidParameterValueException' &&
            error.message ===
              'The role defined for the function cannot be assumed by Lambda.') ||
          error.message.includes('was not ready for lambda function')
        ) {
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          throw error
        }
      }
    }

    throw new Error('Throttled :(')
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      return await lambda
        .createFunction({
          Code,
          FunctionName,
          Description: `soflow: ${description}`,
          Handler,
          MemorySize,
          Role,
          Runtime,
          Timeout,
          Environment,
          Publish: true,
        })
        .promise()
    } catch (error) {
      lastError = error

      if (
        error.code === 'InvalidParameterValueException' &&
        error.message ===
          'The role defined for the function cannot be assumed by Lambda.'
      ) {
        await new Promise(resolve => setTimeout(resolve, 500))
      } else if (error.code === 'TooManyRequestsException') {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000))
      } else {
        throw error
      }
    }
  }

  throw lastError
}

module.exports = createOrUpdateLambdaFunction
