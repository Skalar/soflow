function runTask(taskName, input) {
  const task = this.soflow.tasks[taskName]

  return task.apply(task, input)
}

export default runTask
