import AWS from 'aws-sdk'

const swf = new AWS.SWF({region: 'eu-west-1'})

export default async function WorkflowType(event) {
  const {
    RequestType,
    ResourceProperties,
  } = event

  const {
    domain,
    name,
    version,
    defaultTaskListName,
    lambdaRole,
  } = ResourceProperties

  switch (RequestType) {
    case 'Update':
    // fallthrough
    case 'Create': {
      try {
        await swf.registerWorkflowType({
          domain,
          name,
          version,
          defaultTaskList: {
            name: defaultTaskListName
          },
          defaultLambdaRole: lambdaRole,
        }).promise()
      }

      catch (error) {
        if (error.code !== 'TypeAlreadyExistsFault') {
          throw error
        }
      }

      break
    }

    case 'Delete': {
      break
    }

  }

  return {PhysicalResourceId: `swfworkflowtype:${domain}:${name}@${version}`}
}
