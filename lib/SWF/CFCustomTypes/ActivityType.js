import AWS from 'aws-sdk'

export default async function ActivityType(event) {
  const {
    RequestType,
    ResourceProperties,
  } = event

  const {
    domain,
    region = 'eu-west-1',
    name,
    version,
    description,
    // defaultTask,
    defaultTaskHeartbeatTimeout,
    defaultTaskScheduleToCloseTimeout,
    defaultTaskScheduleToStartTimeout,
    defaultTaskStartToCloseTimeout,
    defaultTaskPriority,
    defaultTaskList,
  } = ResourceProperties

  const swf = new AWS.SWF({region})

  switch (RequestType) {
    case 'Update':
    // fallthrough
    case 'Create': {
      try {
        const params = {
          domain,
          name,
          version,
          description,
          defaultTaskHeartbeatTimeout,
          defaultTaskScheduleToCloseTimeout,
          defaultTaskScheduleToStartTimeout,
          defaultTaskStartToCloseTimeout,
          defaultTaskPriority,
        }

        if (defaultTaskList && defaultTaskList.name) {
          params.defaultTaskList = defaultTaskList
        }

        await swf.registerActivityType(params).promise()
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
  return {PhysicalResourceId: `swfactivitytype:${domain}:${name}@${version}`}
}
