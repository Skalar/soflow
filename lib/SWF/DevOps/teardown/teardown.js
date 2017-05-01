import * as components from './components'
import async from 'async'
import EventEmitter from 'events'

function teardown({
  namespace,
  domain = namespace,
  removeBucket = false,
  s3Bucket = namespace,
  s3Prefix = 'soflow/',
  region = 'eu-west-1',
}) {
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
      ...resource(data)
    }),
    {}
  )

  const status = new EventEmitter()

  const wrappedTasks = Object.keys(teardownTasks).reduce(
    (wrapped, taskName) => {
      const task = teardownTasks[taskName]

      function getWrappedFunction(fn) {
        return async.asyncify(
          async (...args) => {
            setImmediate(() => status.emit('taskStarted', taskName))
            const result = await fn.apply(fn, args)
            setImmediate(() => status.emit('taskCompleted', taskName))
            return result
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
        () => status.emit('init', {tasks: Object.keys(teardownTasks)})
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

export default teardown
