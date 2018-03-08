const config = require('../../../config')
const DeciderWorker = require('../../DeciderWorker')

function deciderHandler(
  {taskList, polltimeSlack = config.lambdaDeciderPolltimeSlackInSeconds},
  context,
  callback
) {
  let workflows = {}
  let tasks = {}

  if (process.env.SOFLOW_WORKFLOWS_PATH) {
    const workflowsPath = `${process.cwd()}/${
      process.env.SOFLOW_WORKFLOWS_PATH
    }`
    workflows = require(workflowsPath)
    const workflowNames = Object.keys(workflows)
    console.info(
      `Loaded ${
        workflowNames.length
      } workflows from ${workflowsPath}: ${workflowNames.join(', ')}`
    )
  }

  if (process.env.SOFLOW_TASKS_PATH) {
    const tasksPath = `${process.cwd()}/${process.env.SOFLOW_TASKS_PATH}`
    tasks = require(tasksPath)
    const taskNames = Object.keys(tasks)
    console.info(
      `Loaded ${taskNames.length} tasks from ${tasksPath}: ${taskNames.join(
        ', '
      )}`
    )
  }

  const deciderWorker = new DeciderWorker({
    concurrency: 4,
    identity: context.logStreamName,
    workflows,
    tasks,
    taskList,
    shouldContinuePolling: () =>
      context.getRemainingTimeInMillis() >= (60 + polltimeSlack) * 1000,
  })

  deciderWorker.on('stopped', () => callback())
  deciderWorker.on('error', error => {
    callback(error)
    return process.exit(1)
  })

  deciderWorker.start()
}

exports.handler = deciderHandler
