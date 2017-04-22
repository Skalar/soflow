import AWS from 'aws-sdk'
import {timeout} from '~/lib/Utils'
import S3TempFile from './S3TempFile'

async function updateCFStack({stackName, template, region, s3Bucket, s3Prefix}) {
  const cf = new AWS.CloudFormation({region})
  const s3Template = new S3TempFile({bucket: s3Bucket, prefix: s3Prefix})
  await s3Template.put(JSON.stringify(template))

  const {StackId: stackId} = await cf.updateStack({
    StackName: stackName,
    Capabilities: [
      'CAPABILITY_IAM',
      'CAPABILITY_NAMED_IAM',
    ],
    // NotificationARNs: [
    //
    // ],
    TemplateURL: s3Template.getSignedUrl(),
  }).promise()


  // Wait for creation to end
  const maxAttempts = 500
  const waitBetweenTries = 5

  try {
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
  finally {
    await s3Template.delete()
  }
}


export default updateCFStack
