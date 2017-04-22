import AWS from 'aws-sdk'
import {timeout} from '~/lib/Utils'
import S3TempFile from './S3TempFile'


async function createCFStack({stackName, template, region, s3Bucket, s3Prefix}) {
  const cf = new AWS.CloudFormation({region})

  const stackParams = {
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
  }

  let s3Template

  if (s3Bucket) {
    s3Template = new S3TempFile({bucket: s3Bucket, prefix: s3Prefix})
    await s3Template.put(JSON.stringify(template))

    await cf.createStack({
      ...stackParams,
      TemplateURL: s3Template.getSignedUrl(),
    }).promise()
  }
  else {
    await cf.createStack({
      ...stackParams,
      TemplateBody: JSON.stringify(template),
    }).promise()
  }

  // Wait for creation to end
  const maxAttempts = 100
  const waitBetweenTries = 5

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const {Stacks: [stack]} = await cf.describeStacks({
        StackName: stackName
      }).promise()

      switch (stack.StackStatus) {
        case 'CREATE_IN_PROGRESS': {
          break
        }
        case 'CREATE_COMPLETE': {
          return true
        }
        default: {
          throw new Error(`${stack.StackStatus}: ${stack.StatStatusReason}`)
        }
      }

      await timeout(waitBetweenTries * 1000)
    }

    throw new Error('Timed out while waiting for stack to be created')
  }
  finally {
    if (s3Template) {
      await s3Template.delete()
    }
  }
}


export default createCFStack
