const config = require('../../../config')
const components = require('./components')
const async = require('async')
const EventEmitter = require('events')
const progressIndicator = require('../progressIndicator')

function setup({
  namespace = config.namespace,
  domain = config.swfDomain,
  version = config.workflowsVersion,
  codeRoot = config.codeRoot,
  workflowsPath = config.workflowsPath,
  tasksPath = config.tasksPath,
  s3Bucket = config.s3Bucket,
  s3Prefix = config.s3Prefix,
  executionRetention = config.executionRetention,
  domainDescription = config.swfDomainDescription,
  region = config.awsRegion,
  modulesPath = config.modulesPath,
  soflowPath = config.soflowPath,
  includeBaseFiles = true,
  files = [`${tasksPath}/**`, `${workflowsPath}/**`],
  ignore = ['**/*.md'],
  createBucket = true,
  deciderEnvironment = {},
  progressIndicator: showProgressIndicator = false,
} = {}) {
  if (!version.match(/^(?!^[0-9]+$)([a-zA-Z0-9-_]+)$/)) {
    throw new Error('Invalid version')
  }

  if (namespace.length > 32) {
    throw new Error('Namespace has to be 32 characters or less')
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
    modulesPath,
    soflowPath,
    tasksPath,
    workflowsPath,
    includeBaseFiles,
    workflowExecutionRetentionPeriodInDays: executionRetention,
    domainDescription,
    deciderEnvironment,
  }

  const setupTasks = Object.values(components).reduce(
    (setupTasks, resource) => ({
      ...setupTasks,
      ...resource(data),
    }),
    {}
  )

  const status = new EventEmitter()

  const wrappedTasks = Object.keys(setupTasks).reduce((wrapped, taskName) => {
    const task = setupTasks[taskName]

    function getWrappedFunction(fn) {
      return async.asyncify(async (...args) => {
        setImmediate(() => status.emit('taskStarted', taskName))
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const result = await fn.apply(fn, args)
            setImmediate(() => status.emit('taskCompleted', taskName))
            return result
          } catch (error) {
            if (
              ['TooManyRequestsException', 'ThrottlingException'].includes(
                error.code
              )
            ) {
              await new Promise(resolve =>
                setTimeout(resolve, Math.random() * 2000)
              )
            } else {
              const decoratedError = new Error(
                `Error in task ${taskName}: ${error.message}`
              )
              decoratedError.originalError = error
              throw decoratedError
            }
          }
        }
      })
    }
    if (Array.isArray(task)) {
      return {
        ...wrapped,
        [taskName]: [
          ...task.slice(0, -1),
          getWrappedFunction(task[task.length - 1]),
        ],
      }
    }

    return {
      ...wrapped,
      [taskName]: getWrappedFunction(task),
    }
  }, {})

  const promise = (async () => {
    setImmediate(() => status.emit('init', {tasks: Object.keys(setupTasks)}))

    return new Promise((resolve, reject) => {
      async.auto(wrappedTasks, 10, (err, results) => {
        if (err) return reject(err)
        return resolve(results)
      })
    })
  })()

  promise.status = status

  if (showProgressIndicator) {
    progressIndicator(promise, {
      description: `Setting up ${namespace} (version: ${version})`,
    })
  }

  return promise
}

module.exports = setup
