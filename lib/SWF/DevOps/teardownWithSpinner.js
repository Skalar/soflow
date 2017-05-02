import ora from 'ora'
import {round} from 'lodash'
import teardown from './teardown'

async function teardownWithSpinner(params) {
  const {namespace} = params
  const teardownProcess = teardown(params)

  const spinner = ora('Initializing...').start()

  let totalTasks = 0
  let completedTasks = 0
  const currentTasks = {}
  spinner.color = 'yellow'
  const startTime = new Date()

  try {
    function updateStatus() {
      const progress = `[${completedTasks}/${totalTasks}]`
      const activeTaskCount = Object.keys(currentTasks).length
      const taskStatus = activeTaskCount
        ? `(${Object.keys(currentTasks)[0]}${activeTaskCount > 1 ? ` + ${Object.keys(currentTasks).length - 1}` : ''})`
        : ''
      spinner.text = `${progress} Tearing down ${namespace} ${taskStatus}`
    }

    teardownProcess.status.on('init', ({tasks}) => {
      totalTasks = tasks.length
    })

    teardownProcess.status.on('taskStarted', name => {
      currentTasks[name] = true
      updateStatus()
    })

    teardownProcess.status.on('taskCompleted', name => {
      delete currentTasks[name]
      // spinner.start()
      completedTasks++
      updateStatus()
    })

    const result = await teardownProcess
    const elapsedSeconds = round((new Date() - startTime) / 1000, 2)
    spinner.succeed(`Tore down ${namespace} in ${elapsedSeconds} seconds`)

    return result
  }
  catch (error) {
    console.dir({error}, {showHidden: false, depth: null})
    spinner.stop()
    throw error
  }
}

export default teardownWithSpinner
