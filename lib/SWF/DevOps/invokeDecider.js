import AWS from 'aws-sdk'

const lambda = new AWS.Lambda({region: process.env.AWS_DEFAULT_REGION})

function invokeDecider({
  namespace,
  version = '$LATEST',
}) {
  return lambda.invoke({
    FunctionName: `${namespace}_decider:${version}`,
    InvocationType: 'Event',
    Payload: JSON.stringify({a: 1}),
  }).promise()
}

export default invokeDecider
