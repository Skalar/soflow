import AWS from 'aws-sdk'
import {timeout} from '~/lib/Utils'


async function updateCFStack({stackName, template, region}) {
  const cf = new AWS.CloudFormation({region})

  const {StackId: stackId} = await cf.updateStack({
    StackName: stackName,
    Capabilities: [
      'CAPABILITY_IAM',
      'CAPABILITY_NAMED_IAM',
    ],
    // NotificationARNs: [
    //
    // ],
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
      case 'UPDATE_IN_PROGRESS': {
        break
      }
      case 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS':
      case 'UPDATE_COMPLETE': {
        return stackId
      }
      default: {
        throw new Error(`${stack.StackStatus}: ${stack.StatStatusReason}`)
      }
    }

    await timeout(waitBetweenTries * 1000)
  }

  throw new Error('Timed out while waiting for stack to be updated')
}


export default updateCFStack
