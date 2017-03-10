let tasks = {}

if (process.env.TASKS_PATH) {
  tasks = require(`${process.cwd()}/${process.env.TASKS_PATH}`)
}

module.exports = Object.keys(tasks).reduce(
  (lambdaTasks, taskName) => ({
    ...lambdaTasks,
    [taskName]: async (event, context, callback) => {
      try {
        return callback(null, await tasks[taskName](...event))
      }
      catch (error) {
        return callback(error)
      }
    }
  }),
  {}
)
