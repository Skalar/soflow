import {
  TaskTimedOut,
  TaskStartFailed
} from '~/lib/Errors'

import awsName from '~/lib/SWF/awsName'

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
          name: awsName.lambda(`${this.namespace}_${taskName}`), // :${this.version}
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
          const {errorMessage, errorType, stackTrace} = task.state
          const error = new Error(errorMessage)
          error.name = errorType
          error.stack = stackTrace

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
