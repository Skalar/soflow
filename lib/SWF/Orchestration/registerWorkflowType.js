const config = require('../../config')

async function registerWorkflowType(params) {
  const swf = new config.AWS.SWF()

  try {
    return await swf.registerWorkflowType(params).promise()
  } catch (error) {
    if (error.code !== 'TypeAlreadyExistsFault') {
      throw error
    }

    const {domain, name, version} = params
    return swf
      .describeWorkflowType({
        domain,
        workflowType: {
          name,
          version,
        },
      })
      .promise()
  }
}

module.exports = registerWorkflowType
