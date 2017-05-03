import AWS from 'aws-sdk'
import Context from './Context'
import {inspect} from 'util'
import {get} from 'lodash'
import winston from 'winston'
import serializeError from 'serialize-error'

const swf = new AWS.SWF()
const maximumPageSize = 1000

winston.level = process.env.LOG_LEVEL

let loadedWorkflows = {}
let loadedTasks = {}

if (process.env.WORKFLOWS_PATH) {
  const workflowsPath = `${process.cwd()}/${process.env.WORKFLOWS_PATH}`
  winston.info(`Loading workflows from ${workflowsPath}`)
  loadedWorkflows = require(workflowsPath)
}

if (process.env.TASKS_PATH) {
  const tasksPath = `${process.cwd()}/${process.env.TASKS_PATH}`
  winston.info(`Loading tasks from ${tasksPath}`)
  loadedTasks = require(tasksPath)
}


async function Decider(options, context, callback) {
  const identity = context.logStreamName

  try {
    const {
      namespace = process.env.SOFLOW_NAMESPACE,
      domain = process.env.SOFLOW_DOMAIN,
      version = process.env.SOFLOW_WORKFLOWS_VERSION,
      approximateTimePerPollIncludingHandling = 60000,
      workflows = loadedWorkflows,
      tasks = loadedTasks,
    } = options

    let shuttingDown = false

    winston.info(`Decider starting. Namespace: ${namespace} Domain: ${domain} Version: ${version}`)

    async function pollAndHandleDecisionTask() {
      let task, workflowError, workflowResult, workflow
      const events = []

      while (!task || task.nextPageToken) {
        const taskListName = `${namespace}_${version}`
        winston.info(`Polling '${taskListName}' for decision task...`)

        task = await swf.pollForDecisionTask({
          domain,
          identity,
          maximumPageSize,
          taskList: {name: taskListName},
          nextPageToken: task ? task.nextPageToken : undefined,
        }).promise()

        if (!task.taskToken) {
          winston.info(`Polling '${taskListName}' did not yield a decision task`)
          return
        }

        task.events.forEach(event => events.push(event))
      }

      winston.info('Got decisionTask', task)

      const {
        taskToken,
        workflowType: {name: namespacedName},
        workflowExecution: {workflowId}
      } = task

      const workflowName = namespacedName.replace(`${namespace}_`, '')

      if (workflowName === 'DeciderControl') {
        // Do more sophisticated stuff with input here in the future.
        // Currently we only need to be able to gracefully shut down deciders.
        winston.info('Got DeciderControl workflow, shutting down..')
        shuttingDown = true
        workflow = () => Promise.resolve(true)
      } else {
        workflow = workflows[workflowName]
      }

      if (typeof workflow !== 'function') {
        throw new Error(`Unknown workflow '${workflowName}'`)
      }

      const deciderContext = Context({
        namespace,
        version,
        workflows,
        events,
        tasks,
        config: get(workflow, 'config.SWF')
      })
      const workflowDecisionPromise = workflow(deciderContext)

      const initialResult = {}
      workflowResult = initialResult

      workflowDecisionPromise
        .then(result => { workflowResult = result })
        .catch(error => { workflowError = error })

      // Wait for decider function to complete
      await new Promise(resolve => setImmediate(resolve))

      const {decisions} = deciderContext

      if (workflowResult !== initialResult) {
        winston.debug('The workflow has completed successfully', workflowResult)

        if (deciderContext.state.activityTask.workflowCallback) {
          winston.debug('Callback has been scheduled, sending decision to complete workflow')

          decisions.push({
            decisionType: 'CompleteWorkflowExecution',
            completeWorkflowExecutionDecisionAttributes: {
              result: JSON.stringify(workflowResult)
            }
          })
        } else {
          winston.debug('Scheduling callback')

          decisions.push({
            decisionType: 'ScheduleActivityTask',
            scheduleActivityTaskDecisionAttributes: {
              activityId: 'workflowCallback',
              activityType: {
                name: `${namespace}_workflowCallback`,
                version: 'default',
              },
              input: JSON.stringify({result: workflowResult}),
              taskList: {name: workflowId},
              heartbeatTimeout: '5',
            }
          })
        }
      } else if (typeof workflowError !== 'undefined') {
        const {name, message, stackTrace} = workflowError
        winston.error(workflowError)

        if (deciderContext.state.activityTask.workflowCallback) {
          winston.debug('Failing workflow execution')

          decisions.push({
            decisionType: 'FailWorkflowExecution',
            failWorkflowExecutionDecisionAttributes: {
              reason: workflowError.name || workflowError.toString(),
              details: JSON.stringify(serializeError(workflowError))
            }
          })
        } else {
          winston.error('Workflow failed, scheduling callback')

          decisions.push({
            decisionType: 'ScheduleActivityTask',
            scheduleActivityTaskDecisionAttributes: {
              activityId: 'workflowCallback',
              activityType: {
                name: `${namespace}_workflowCallback`,
                version: 'default',
              },
              input: JSON.stringify({error: {name, message, stackTrace}}),
              taskList: {name: workflowId},
              heartbeatTimeout: '5',
            }
          })
        }
      }

      winston.debug('Decisions', inspect(decisions, false, null))
      return swf.respondDecisionTaskCompleted({taskToken, decisions}).promise()
    }

    while (
      !shuttingDown && context.getRemainingTimeInMillis() >= approximateTimePerPollIncludingHandling
    ) {
      winston.debug('Time left.. polling')
      await pollAndHandleDecisionTask()
    }
    winston.info('No more time, exiting...')
    return callback()
  }
  catch (error) {
    winston.error(error)
    return callback(error)
  }
}

export default Decider
