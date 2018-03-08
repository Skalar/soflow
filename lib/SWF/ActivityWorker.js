const Worker = require('./Worker')
const serializeError = require('serialize-error')

class ActivityWorker extends Worker {
  async pollForTask() {
    const {swfDomain, identity, taskList} = this
    let request

    try {
      request = this.swf.pollForActivityTask({
        domain: swfDomain,
        identity,
        taskList: {name: taskList},
      })

      this.pollRequests.add(request)

      return await request.promise()
    } catch (error) {
      if (error.code !== 'RequestAbortedError') {
        throw error
      }
    } finally {
      this.pollRequests.delete(request)
    }
  }

  async handleTask(activityTask) {
    const {
      activityType: {name: activityTypeName},
      taskToken,
      input: inputJSON,
    } = activityTask

    const taskName = activityTypeName.replace(`${this.activityTaskPrefix}_`, '')
    const task = this.tasks[taskName]

    try {
      const args = JSON.parse(inputJSON)
      const result = await task.apply(task, args)
      this.emit('taskCompleted', {task: activityTask, result})

      await this.swf
        .respondActivityTaskCompleted({
          taskToken,
          result: JSON.stringify(result),
        })
        .promise()
    } catch (error) {
      this.emit('taskFailed', {task: activityTask, error})

      await this.swf
        .respondActivityTaskFailed({
          taskToken,
          reason: error.toString(),
          details: JSON.stringify(serializeError(error)),
        })
        .promise()
    }
  }
}

module.exports = ActivityWorker
