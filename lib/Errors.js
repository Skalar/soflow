export class NoSuchWorkflow extends Error {
  name = 'NoSuchWorkflow'
}

export class TaskTimedOut extends Error {
  name = 'TaskTimedOut'
}

export class TaskFailed extends Error {
  constructor({errorType, errorMessage, stackTrace}) {
    super(errorMessage)
    this.name = errorType
    this.stackTrace = stackTrace
  }
}

export class WorkflowError extends Error {
  constructor({name, message, stackTrace}) {
    super(message)
    this.name = name
    this.stackTrace = stackTrace
  }
}


export class TaskStartFailed extends Error {
  name = 'TaskStartFailed'
  cause = ''
}

//
// export class NotImplementedError extends Error {
//   name = 'NotImplementedError'
// }
