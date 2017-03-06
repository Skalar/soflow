import AWS from 'aws-sdk'
import {timeout} from '~/lib/Utils'

export default async function teardown({
  namespace,
  region = 'eu-west-1',
}) {
  const cf = new AWS.CloudFormation({region})

  await cf.deleteStack({
    StackName: namespace
  }).promise()

  // Wait for creation to end
  const maxAttempts = 100
  const waitBetweenTries = 5

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const {Stacks: [stack]} = await cf.describeStacks({
        StackName: namespace
      }).promise()

      switch (stack.StackStatus) {
        case 'DELETE_IN_PROGRESS': {
          break
        }
        case 'DELETE_COMPLETE': {
          return
        }
        default: {
          throw new Error(`${stack.StackStatus}: ${stack.StatStatusReason}`)
        }
      }
    } catch (error) {
      if (error.name === 'ValidationError') {
        return
      }
    }

    await timeout(waitBetweenTries * 1000)
  }
}
