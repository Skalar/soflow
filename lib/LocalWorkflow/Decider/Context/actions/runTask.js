function runTask(taskName, input) {
  const task = this._tasks[taskName]

  return task.apply(task, input)
}

export default runTask
