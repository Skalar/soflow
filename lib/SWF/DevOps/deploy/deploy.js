import * as components from './components'
import async from 'async'
import EventEmitter from 'events'

function deploy({
  namespace,
  domain = namespace,
  version = 'defaultVersion',
  codeRoot = process.cwd(),
  workflowsPath = 'workflows',
  tasksPath = 'tasks',
  files = ['**'],
  ignore = ['.git/**'],
  createBucket = true,
  s3Bucket = namespace,
  s3Prefix = 'soflow/',
  workflowExecutionRetentionPeriodInDays = 7,
  domainDescription = 'SoFlow workflows',
  region = process.env.AWS_DEFAULT_REGION || 'eu-west-1',
  soflowRoot = 'node_modules/soflow',
  enableDeciderSchedule = true,
}) {
  if (!version.match(/^(?!^[0-9]+$)([a-zA-Z0-9-_]+)$/)) {
    throw new Error('Invalid version')
  }

  const workflows = require(`${codeRoot}/${workflowsPath}`)
  const tasks = require(`${codeRoot}/${tasksPath}`)

  const data = {
    namespace,
    domain,
    workflows,
    tasks,
    version,
    codeRoot,
    s3Bucket,
    s3Prefix,
    createBucket,
    files,
    ignore,
    region,
    soflowRoot,
    tasksPath,
    workflowsPath,
    workflowExecutionRetentionPeriodInDays,
    domainDescription,
    enableDeciderSchedule,
  }

  const deployTasks = Object.values(components).reduce(
    (deployTasks, resource) => ({
      ...deployTasks,
      ...resource(data)
    }),
    {}
  )

  const status = new EventEmitter()

  const wrappedTasks = Object.keys(deployTasks).reduce(
    (wrapped, taskName) => {
      const task = deployTasks[taskName]

      function getWrappedFunction(fn) {
        return async.asyncify(
          async (...args) => {
            setImmediate(() => status.emit('taskStarted', taskName))
            for (let attempt = 0; attempt < 10; attempt++) {
              try {
                const result = await fn.apply(fn, args)
                setImmediate(() => status.emit('taskCompleted', taskName))
                return result
              }
              catch (error) {
                if (error.code === 'TooManyRequestsException') {
                  console.warn('Throttling in wrapped')
                  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000))
                }
                else {
                  throw error
                }
              }
            }
          }
        )
      }
      if (Array.isArray(task)) {
        return {
          ...wrapped,
          [taskName]: [
            ...task.slice(0, -1),
            getWrappedFunction(task[task.length - 1])
          ]
        }
      }

      return {
        ...wrapped,
        [taskName]: getWrappedFunction(task)
      }
    },
    {}
  )

  const promise = (
    async () => {
      setImmediate(
        () => status.emit('init', {tasks: Object.keys(deployTasks)})
      )

      return new Promise((resolve, reject) => {
        async.auto(wrappedTasks, 10, (err, results) => {
          if (err) return reject(err)
          return resolve(results)
        })
      })
    }
  )()

  promise.status = status

  return promise
}

export default deploy
