import AWS from 'aws-sdk'

const swf = new AWS.SWF({region: 'eu-west-1'})

export default async function Domain(event) {
  const {
    RequestType,
    ResourceProperties,
  } = event

  const {
    name,
    workflowExecutionRetentionPeriodInDays = '1',
    description = 'SoFlow workflows',
  } = ResourceProperties

  switch (RequestType) {
    case 'Update':
    // fallthrough
    case 'Create': {
      try {
        await swf.registerDomain({
          name,
          workflowExecutionRetentionPeriodInDays,
          description,
        }).promise()
      }
      catch (error) {
        if (error.code !== 'DomainAlreadyExistsFault') {
          throw error
        }
      }
      break
    }
    case 'Delete': {
      break
    }

  }
  return {PhysicalResourceId: `swfdomain:${name}`}
}
