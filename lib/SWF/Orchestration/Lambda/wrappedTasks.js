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
  wrappedTasks[taskName] = async (event) => {
    const task = tasks[taskName]
    return task.apply(task, event)
  }
}

module.exports = wrappedTasks
