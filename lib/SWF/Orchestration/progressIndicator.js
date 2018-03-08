const ora = require('ora')

async function progressIndicator(
  orchestrationProcess,
  {description = ''} = {}
) {
  const spinner = ora('Initializing...').start()
  let totalTasks = 0
  let completedTasks = 0
  const currentTasks = []

  spinner.color = 'yellow'

  try {
    function updateStatus() {
      const progress = `[${completedTasks}/${totalTasks}]`
      const taskStatus = currentTasks.length
        ? `(${currentTasks[0]}${
            currentTasks.length > 1 ? ` & ${currentTasks.length - 1} more` : ''
          })`
        : ''
      spinner.text = `${progress} ${description} ${taskStatus}`.substr(
        0,
        process.stdout.columns - 2
      )
    }
    orchestrationProcess.status.on('init', ({tasks}) => {
      totalTasks = tasks.length
    })
    orchestrationProcess.status.on('taskStarted', name => {
      currentTasks.push(name)
      updateStatus()
    })
    orchestrationProcess.status.on('taskCompleted', name => {
      currentTasks.splice(currentTasks.indexOf(name), 1)
      completedTasks++
      updateStatus()
    })
    const result = await orchestrationProcess
    spinner.stop()
    return result
  } catch (error) {
    console.dir({error}, {showHidden: false, depth: null})
    spinner.stop()
    throw error
  }
}

module.exports = progressIndicator
