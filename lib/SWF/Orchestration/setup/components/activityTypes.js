const config = require('../../../../config')

const get = require('lodash.get')

module.exports = function({
  activityTaskPrefix,
  domain,
  workflows,
  tasks,
  version,
}) {
  const swf = new config.AWS.SWF()
  const setupTasks = {}

  setupTasks['activityType.workflowCallback'] = [
    'domain',
    async () => {
      try {
        return await swf
          .registerActivityType({
            domain,
            name: [activityTaskPrefix, 'workflowCallback']
              .filter(v => v)
              .join('_'),
            defaultTaskScheduleToCloseTimeout: '5',
            defaultTaskScheduleToStartTimeout: '10',
            defaultTaskStartToCloseTimeout: '5',
            version: 'default', // No need for versioning on this one?
            description:
              'Activity used to provide callback when workflow completes or fails',
          })
          .promise()
      } catch (error) {
        if (error.code !== 'TypeAlreadyExistsFault') throw error
      }
    },
  ]

  for (const taskName of Object.keys(tasks)) {
    const isUsedAsActivityTaskInAWorkflow = Object.values(workflows).some(
      workflow => {
        const taskType = get(workflow.config, ['tasks', taskName, 'type'])
        const defaultType = get(workflow.config, 'tasks.default.type')
        return (
          ['activity', 'both'].includes(taskType) ||
          (['activity', 'both'].includes(defaultType) && !taskType)
        )
      }
    )

    const isConfiguredAsActivityTask = ['activity', 'both'].includes(
      get(tasks[taskName], 'config.type')
    )

    if (!isConfiguredAsActivityTask && !isUsedAsActivityTaskInAWorkflow) {
      continue
    }

    setupTasks[`task.${taskName}.activityType`] = [
      'domain',
      async () => {
        try {
          return await swf
            .registerActivityType({
              domain,
              name: [activityTaskPrefix, taskName].filter(v => v).join('_'),
              version,
              // description,
            })
            .promise()
        } catch (error) {
          if (error.code !== 'TypeAlreadyExistsFault') throw error
        }
      },
    ]
  }

  return setupTasks
}
