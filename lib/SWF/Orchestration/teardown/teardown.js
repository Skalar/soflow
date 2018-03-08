const config = require('../../../config')
const components = require('./components')
const async = require('async')
const EventEmitter = require('events')
const progressIndicator = require('../progressIndicator')

function teardown({
  namespace = config.namespace,
  domain = config.swfDomain,
  removeBucket = false,
  s3Bucket = config.s3Bucket,
  s3Prefix = config.s3Prefix,
  region = config.awsRegion,
  progressIndicator: showProgressIndicator = false,
} = {}) {
  const data = {
    namespace,
    domain,
    s3Bucket,
    s3Prefix,
    removeBucket,
    region,
  }

  const teardownTasks = Object.values(components).reduce(
    (teardownTasks, resource) => ({
      ...teardownTasks,
      ...resource(data),
    }),
    {}
  )

  const status = new EventEmitter()

  const wrappedTasks = Object.keys(teardownTasks).reduce(
    (wrapped, taskName) => {
      const task = teardownTasks[taskName]

      function getWrappedFunction(fn) {
        return async.asyncify(async (...args) => {
          setImmediate(() => status.emit('taskStarted', taskName))
          const result = await fn.apply(fn, args)
          setImmediate(() => status.emit('taskCompleted', taskName))
          return result
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
    },
    {}
  )

  const promise = (async () => {
    setImmediate(() => status.emit('init', {tasks: Object.keys(teardownTasks)}))

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
      description: `Tearing down ${namespace}*`,
    })
  }

  return promise
}

module.exports = teardown
