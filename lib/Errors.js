export class NoSuchWorkflow extends Error {
  name = 'NoSuchWorkflow'
}

export class TaskTimedOut extends Error {
  name = 'TaskTimedOut'
}

export class TaskFailed extends Error {
  name = 'TaskFailed'
}

export class TaskStartFailed extends Error {
  name = 'TaskStartFailed'
  cause = ''
}

//
// export class NotImplementedError extends Error {
//   name = 'NotImplementedError'
// }
