function ActivityTask(workflowEvents) {
  const instances = {}
  const scheduledEventIdToTaskId = {}

  for (const event of workflowEvents) {
    switch (event.eventType) {
      case 'ActivityTaskScheduled': {
        const {
          activityId,
          // name,
          input,
          // startToCloseTimeout,
          // decisionTaskCompletedEventId,
        } = event.activityTaskScheduledEventAttributes

        instances[activityId] = {
          input,
          state: {name: 'scheduled'},
          // scheduledEventId: event.eventId,
          events: [event],
        }

        scheduledEventIdToTaskId[event.eventId] = activityId
        break
      }

      case 'ActivityTaskStarted': {
        const {
          scheduledEventId,
        } = event.activityTaskStartedEventAttributes
        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'started'}
        break
      }

      case 'ActivityTaskCompleted': {
        const {
          scheduledEventId,
          // startedEventId,
          result,
        } = event.activityTaskCompletedEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'completed', result}

        break
      }

      case 'ActivityTaskFailed': {
        const {
          scheduledEventId,
          // startedEventId,
          reason,
          details,
        } = event.activityTaskFailedEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'failed', reason, details}

        break
      }

      case 'ActivityTaskTimedOut': {
        const {
          scheduledEventId,
          // startedEventId,
          timeoutType,
        } = event.activityTaskTimedOutEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'timedOut', timeoutType}

        break
      }

      case 'ScheduleActivityTaskFailed': {
        const {
          activityId,
          cause,
          // name,
          // decisionTaskCompletedEventId,
        } = event.scheduleActivityTaskFailedEventAttributes

        const instance = instances[activityId] = {}

        instance.state = {name: 'scheduleFailed', cause}
        break
      }

      case 'StartActivityTaskFailed': {
        const {
          scheduledEventId,
          cause,
          message,
        } = event.startActivityTaskFailedEventAttributes

        const instance = instances[
          scheduledEventIdToTaskId[scheduledEventId]
        ]

        instance.state = {name: 'startFailed', cause, message}
        break
      }

      // case 'ActivityTaskCanceled': {
      //   instance.state = {name: 'canceled'}
      //   break
      // }
      //
      // case 'ActivityTaskCancelRequested': {
      //   instance.state = {name: 'cancelling'}
      //
      //   break
      // }
      //
      // case 'RequestCancelActivityTaskFailed': {
      //   instance.state = {name: 'cancelFailed'}
      //
      //   break
      // }


      default: {
        break
      }
    }
  }

  return instances
}


export default ActivityTask
