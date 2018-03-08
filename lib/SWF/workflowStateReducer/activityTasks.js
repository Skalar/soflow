const parseJSONWithFallback = require('./helpers/parseJSONWithFallback')

function activityTasks(activityTasks = {}, events = []) {
  for (const event of events) {
    switch (event.eventType) {
      case 'ActivityTaskScheduled': {
        const {
          activityId,
          name,
          input,
          startToCloseTimeout,
          // decisionTaskCompletedEventId,
        } = event.activityTaskScheduledEventAttributes

        activityTasks[activityId] = {
          name,
          input: parseJSONWithFallback(input),
          status: 'scheduled',
          scheduledAt: event.eventTimestamp,
          startToCloseTimeout: parseInt(startToCloseTimeout, 10),
          scheduledEventId: event.eventId,
        }

        break
      }

      case 'ActivityTaskStarted': {
        const {scheduledEventId} = event.activityTaskStartedEventAttributes

        const activityTask = Object.values(activityTasks).find(
          task => task.scheduledEventId === scheduledEventId
        )

        Object.assign(activityTask, {
          status: 'started',
          startedAt: event.eventTimestamp,
        })

        break
      }

      case 'ActivityTaskCompleted': {
        const {
          scheduledEventId,
          // startedEventId,
          result,
        } = event.activityTaskCompletedEventAttributes

        const activityTask = Object.values(activityTasks).find(
          task => task.scheduledEventId === scheduledEventId
        )

        Object.assign(activityTask, {
          status: 'completed',
          completedAt: event.eventTimestamp,
          result: parseJSONWithFallback(result),
        })

        break
      }

      case 'ActivityTaskFailed': {
        const {
          scheduledEventId,
          // startedEventId,
          // reason,
          details,
        } = event.activityTaskFailedEventAttributes

        const activityTask = Object.values(activityTasks).find(
          task => task.scheduledEventId === scheduledEventId
        )

        Object.assign(activityTask, {
          status: 'failed',
          failedAt: event.eventTimestamp,
          error: parseJSONWithFallback(details),
        })

        break
      }

      case 'ActivityTaskTimedOut': {
        const {
          scheduledEventId,
          // startedEventId,
          details,
          timeoutType,
        } = event.activityTaskTimedOutEventAttributes

        const activityTask = Object.values(activityTasks).find(
          task => task.scheduledEventId === scheduledEventId
        )

        Object.assign(activityTask, {
          status: 'timedOut',
          timedOutAt: event.eventTimestamp,
          timeoutType,
          details,
        })

        break
      }

      case 'ScheduleActivityTaskFailed': {
        const {
          activityId,
          cause,
          // name,
          // decisionTaskCompletedEventId,
        } = event.scheduleActivityTaskFailedEventAttributes

        activityTasks[activityId] = {
          status: 'scheduleFailed',
          cause,
        }

        break
      }

      case 'StartActivityTaskFailed': {
        const {
          scheduledEventId,
          cause,
          message,
        } = event.startActivityTaskFailedEventAttributes

        const activityTask = Object.values(activityTasks).find(
          task => task.scheduledEventId === scheduledEventId
        )

        Object.assign(activityTask, {status: 'startFailed', cause, message})

        break
      }

      // case 'ActivityTaskCanceled': {
      //   activityTask.state = {name: 'canceled'}
      //   break
      // }
      //
      // case 'ActivityTaskCancelRequested': {
      //   activityTask.state = {name: 'cancelling'}
      //
      //   break
      // }
      //
      // case 'RequestCancelActivityTaskFailed': {
      //   activityTask.state = {name: 'cancelFailed'}
      //
      //   break
      // }
    }
  }

  return activityTasks
}

module.exports = activityTasks
