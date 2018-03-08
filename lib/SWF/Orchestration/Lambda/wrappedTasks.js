let tasks = {}

if (process.env.SOFLOW_TASKS_PATH) {
  const absoluteTasksPath = `${process.cwd()}/${process.env.SOFLOW_TASKS_PATH}`
  tasks = require(absoluteTasksPath)
  const taskNames = Object.keys(tasks)
  console.info(
    `Loaded ${
      taskNames.length
    } tasks from ${absoluteTasksPath}: ${taskNames.join(', ')}`
  )
}

const wrappedTasks = {}

for (const taskName of Object.keys(tasks)) {
  wrappedTasks[taskName] = (event, context, callback) => {
    try {
      const task = tasks[taskName]
      const taskReturnValue = task.apply(task, event)
      if (typeof taskReturnValue.then === 'function') {
        taskReturnValue.then(result => callback(null, result)).catch(callback)
      } else {
        return callback(null, taskReturnValue)
      }
    } catch (error) {
      return callback(error)
    }
  }
}

module.exports = wrappedTasks
