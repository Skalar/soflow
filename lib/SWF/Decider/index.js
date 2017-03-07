import AWS from 'aws-sdk'
import Context from './Context'
import Debug from 'debug'
import {inspect} from 'util'
const swf = new AWS.SWF()
const maximumPageSize = 1000
const log = Debug('soflow')

let loadedWorkflows = {}
let loadedTasks = {}

if (process.env.WORKFLOWS_PATH) {
  const workflowsPath = `${process.cwd()}/${process.env.WORKFLOWS_PATH}`
  log(`Loading workflows from ${workflowsPath}`)
  loadedWorkflows = require(workflowsPath)
}

if (process.env.TASKS_PATH) {
  const tasksPath = `${process.cwd()}/${process.env.TASKS_PATH}`
  log(`Loading tasks from ${tasksPath}`)
  loadedTasks = require(tasksPath)
}


async function Decider(options, context, callback) {
  log('Decider started')

  const identity = context.logStreamName

  try {
    const {
      namespace = process.env.SOFLOW_NAMESPACE,
      domain = process.env.SOFLOW_DOMAIN,
      version = process.env.SOFLOW_WORKFLOWS_VERSION,
      approximateTimePerPollIncludingHandling = 70000,
      workflows = loadedWorkflows,
      tasks = loadedTasks,
    } = options

    async function pollAndHandleDecisionTask() {
      let task, workflowError, workflowResult
      const events = []

      while (!task || task.nextPageToken) {
        log(`[${namespace}_${version}] pollingr for decision task`)

        task = await swf.pollForDecisionTask({
          domain,
          identity,
          maximumPageSize,
          taskList: {
            name: `${namespace}_${version}`,
          },
          nextPageToken: task ? task.nextPageToken : undefined,
        }).promise()

        if (!task.taskToken) {
          log(`[${namespace}_${version}] Poll ended without task`, task)
          return
        }

        task.events.forEach(event => events.push(event))
      }

      const {
        taskToken,
        workflowType: {name: namespacedName},
        workflowExecution: {workflowId}
      } = task

      const workflowName = namespacedName.replace(`${namespace}_`, '')

      const workflow = workflows[workflowName]

      if (typeof workflow !== 'function') {
        throw new Error(`Unknown workflow '${workflowName}'`)
      }

      const deciderContext = Context({
        namespace,
        version,
        workflows,
        events,
        tasks,
      })
      const workflowDecisionPromise = workflow(deciderContext)

      workflowDecisionPromise
        .then(result => { workflowResult = result })
        .catch(error => { workflowError = error })

      // Wait for decider function to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      const {decisions} = deciderContext

      if (typeof workflowResult !== 'undefined') {
        if (deciderContext.state.activityTask.workflowCallback) {
          decisions.push({
            decisionType: 'CompleteWorkflowExecution',
            completeWorkflowExecutionDecisionAttributes: {
              result: JSON.stringify(workflowResult)
            }
          })
        } else {
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

        if (deciderContext.state.activityTask.workflowCallback) {
          decisions.push({
            decisionType: 'FailWorkflowExecution',
            failWorkflowExecutionDecisionAttributes: {
              reason: `${workflowError}`,
              details: workflowError.stack,
            }
          })
        } else {
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

      log(`[${workflowName}] Decisions`, inspect(decisions, false, null))
      return swf.respondDecisionTaskCompleted({taskToken, decisions}).promise()
    }

    while (
      context.getRemainingTimeInMillis() >= approximateTimePerPollIncludingHandling
    ) {
      log('Time left.. polling')
      await pollAndHandleDecisionTask()
    }

    return callback()
  }
  catch (error) {
    log('Error!', error)
    return callback(error)
  }
}

export default Decider
