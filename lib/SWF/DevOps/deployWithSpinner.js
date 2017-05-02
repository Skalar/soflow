import ora from 'ora'
import {round} from 'lodash'
import deploy from './deploy'

async function deployWithSpinner(params) {
  const {namespace, version} = params
  const deployProcess = deploy(params)

  const spinner = ora('Initializing...').start()

  let totalTasks = 0
  let completedTasks = 0
  const currentTasks = []
  spinner.color = 'yellow'
  const startTime = new Date()

  try {
    function updateStatus() {
      const progress = `[${completedTasks}/${totalTasks}]`
      const taskStatus = currentTasks.length
        ? `(${currentTasks[0]}${currentTasks.length > 1 ? ` & ${currentTasks.length - 1} more` : ''})`
        : ''
      spinner.text = `${progress} Deploying ${namespace}@${version} ${taskStatus}`
    }

    deployProcess.status.on('init', ({tasks}) => {
      totalTasks = tasks.length
    })

    deployProcess.status.on('taskStarted', name => {
      currentTasks.push(name)
      updateStatus()
    })

    deployProcess.status.on('taskCompleted', name => {
      currentTasks.splice(currentTasks.indexOf(name), 1)
      completedTasks++
      updateStatus()
    })

    const result = await deployProcess
    const elapsedSeconds = round((new Date() - startTime) / 1000, 2)
    spinner.succeed(`Deployed ${namespace}@${version} in ${elapsedSeconds} seconds`)

    return result
  }
  catch (error) {
    console.dir({error}, {showHidden: false, depth: null})
    spinner.stop()
    throw error
  }
}

export default deployWithSpinner
