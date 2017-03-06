import AWS from 'aws-sdk'
import {timeout} from '~/lib/Utils'


async function createCFStack({stackName, template, region}) {
  const cf = new AWS.CloudFormation({region})

  const {StackId: stackId} = await cf.createStack({
    StackName: stackName,
    Capabilities: [
      'CAPABILITY_IAM',
      'CAPABILITY_NAMED_IAM',
    ],
    // NotificationARNs: [
    //
    // ],
    OnFailure: 'ROLLBACK',
    TimeoutInMinutes: 2,
    TemplateBody: JSON.stringify(template),
  }).promise()


  // Wait for creation to end
  const maxAttempts = 100
  const waitBetweenTries = 5

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const {Stacks: [stack]} = await cf.describeStacks({
      StackName: stackName
    }).promise()

    switch (stack.StackStatus) {
      case 'CREATE_IN_PROGRESS': {
        break
      }
      case 'CREATE_COMPLETE': {
        return stackId
      }
      default: {
        throw new Error(`${stack.StackStatus}: ${stack.StatStatusReason}`)
      }
    }

    await timeout(waitBetweenTries * 1000)
  }

  throw new Error('Timed out while waiting for stack to be created')
}


export default createCFStack
