import {
  TaskTimedOut,
  TaskFailed,
  TaskStartFailed
} from '~/lib/Errors'

function lambdaFunction(taskName, input) {
  const taskId = String(++this.ref)
  const task = this.state.lambdaFunction[taskId]

  return new Promise((resolve, reject) => {
    // TODO include version
    if (!task) {
      this.decisions.push({
        decisionType: 'ScheduleLambdaFunction',
        scheduleLambdaFunctionDecisionAttributes: {
          id: taskId,
          name: `${this.namespace}_${taskName}`, // :${this.version}
          input: JSON.stringify(Array.from(input)),
          startToCloseTimeout: 'NONE'
        }
      })
    }
    else {
      switch (task.state.name) {
        case 'completed': {
          return resolve(JSON.parse(task.state.result))
        }
        case 'failed': {
          const {details, reason} = task.state

          const error = new TaskFailed(details) // e.name is 'Error'
          error.prototype.name = reason

          return reject(error)
        }
        case 'timedOut': {
          return reject(new TaskTimedOut())
        }
        case 'startFailed': {
          const {message} = task.state
          return reject(new TaskStartFailed(message))
        }
      }
    }
  })
}

export default lambdaFunction
