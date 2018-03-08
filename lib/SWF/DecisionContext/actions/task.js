const awsName = require('../../awsName')
const get = require('lodash.get')

function task(
  context,
  {name, type = get(context.taskConfigs, [name, 'type'], 'activity'), ...rest}
) {
  if (type === 'faas' || type === 'both') {
    return lambdaFunction(context, {...rest, name})
  }

  return activity(context, {...rest, name})
}

function lambdaFunction(
  context,
  {
    name,
    args = [],
    id = `${name}-${context.counter('lambdaFunction')}`,
    startToCloseTimeout = get(context.taskConfigs, [
      name,
      'startToCloseTimeout',
    ]),
  } = {}
) {
  const task = context.state.lambdaFunctions[id]
  // const accountId = context.state.workflowExecution.lambdaRole.split(':')[4]
  // const {workflowType: {version}} = context.state.workflowExecution

  return new Promise((resolve, reject) => {
    if (!task) {
      if (!startToCloseTimeout) {
        return reject('startToCloseTimeout not specified')
      }

      context.decisions.push({
        decisionType: 'ScheduleLambdaFunction',
        scheduleLambdaFunctionDecisionAttributes: {
          id,
          // TODO allow specifying version when resolved by AWS
          // name: [
          //   'arn',
          //   'aws',
          //   process.env.AWS_DEFAULT_REGION || 'eu-west-1',
          //   'lambda',
          //   accountId,
          //   'function',
          //   awsName.lambda(`${context.namespace}_${name}`),
          //   version,
          // ].join(':'),
          name: awsName.lambda(`${context.namespace}_${name}`),
          input: JSON.stringify(Array.from(args)),
          startToCloseTimeout: startToCloseTimeout.toString(),
        },
      })
    } else {
      switch (task.status) {
        case 'completed': {
          return resolve(task.result)
        }
        case 'failed': {
          // use serialize-error for faas/activity compat
          const {
            errorMessage: message,
            stackTrace: stack,
            errorType: name,
          } = task.error

          return reject({message, stack, name})
        }
        case 'timedOut': {
          const error = new Error(
            `Lambda function timed out: ${task.timeoutType}`
          )

          return reject(error)
        }
        case 'scheduleFailed': {
          const error = new Error(
            `Lambda function failed to schedule: ${task.cause}`
          )
          return reject(error)
        }
        case 'startFailed': {
          const {message} = task
          return reject(new Error(message))
        }
      }
    }
  })
}

function activity(
  context,
  {
    name,
    args = [],
    taskList = get(
      context.taskConfigs,
      [name, 'taskList'],
      context.state.workflowExecution.taskList
    ),
    id: activityId = `${name}-${context.counter('activityTask')}`,
    scheduleToStartTimeout = get(context.taskConfigs, [
      name,
      'scheduleToStartTimeout',
    ]),
    startToCloseTimeout = get(context.taskConfigs, [
      name,
      'startToCloseTimeout',
    ]),
    scheduleToCloseTimeout = get(
      context.taskConfigs,
      [name, 'scheduleToCloseTimeout'],
      scheduleToStartTimeout + startToCloseTimeout
    ),
  } = {}
) {
  const task = context.state.activityTasks[activityId]
  const {workflowType: {version}} = context.state.workflowExecution

  return new Promise((resolve, reject) => {
    // TODO include version
    if (!task) {
      context.decisions.push({
        decisionType: 'ScheduleActivityTask',
        scheduleActivityTaskDecisionAttributes: {
          activityId,
          activityType: {
            name: [context.activityTaskPrefix, name].filter(v => v).join('_'),
            version,
          },
          input: JSON.stringify(Array.from(args)),
          taskList: {name: taskList},
          heartbeatTimeout: 'NONE',
          ...(scheduleToStartTimeout && {
            // TODO: consider removing check
            scheduleToStartTimeout: scheduleToStartTimeout.toString(),
          }),
          ...(startToCloseTimeout && {
            startToCloseTimeout: startToCloseTimeout.toString(),
          }),
          ...(scheduleToCloseTimeout && {
            scheduleToCloseTimeout: scheduleToCloseTimeout.toString(),
          }),
        },
      })
    } else {
      switch (task.status) {
        case 'completed': {
          return resolve(task.result)
        }
        case 'failed': {
          return reject(task.error)
        }
        case 'timedOut': {
          const error = new Error(`ActivityTask timed out: ${task.timeoutType}`)

          return reject(error)
        }
        case 'scheduleFailed': {
          const error = new Error(
            `ActivityTask failed to schedule: ${task.cause}`
          )
          return reject(error)
        }
        case 'startFailed': {
          const {message} = task
          return reject(new Error(message))
        }
      }
    }
  })
}

module.exports = task
