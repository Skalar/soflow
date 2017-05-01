import AWS from 'aws-sdk'
const swf = new AWS.SWF({region: process.env.AWS_DEFAULT_REGION})

export default function({
  teardown,
  namespace,
  domain: domain,
}) {
  return {
    'activityType.workflowCallback': [
      'domain',
      async () => {
        if (teardown) return null

        try {
          return await swf.registerActivityType({
            domain,
            name: `${namespace}_workflowCallback`,
            defaultTaskScheduleToCloseTimeout: '5',
            defaultTaskScheduleToStartTimeout: '10',
            defaultTaskStartToCloseTimeout: '5',
            version: 'default', // No need for versioning on this one?
            description: 'Activity used to provide callback when workflow completes or fails',
          }).promise()
        }
        catch (error) {
          if (error.code !== 'TypeAlreadyExistsFault') {
            throw error
          }
        }
      }
    ]
  }
}
