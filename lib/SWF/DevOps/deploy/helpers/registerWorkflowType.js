import AWS from 'aws-sdk'
const swf = new AWS.SWF({region: process.env.AWS_DEFAULT_REGION})

async function registerWorkflowType(params) {
  try {
    return await swf.registerWorkflowType(params).promise()
  }
  catch (error) {
    if (error.code !== 'TypeAlreadyExistsFault') {
      throw error
    }

    const {domain, name, version} = params
    return swf.describeWorkflowType({
      domain,
      workflowType: {
        name,
        version,
      }
    }).promise()
  }
}

export default registerWorkflowType
