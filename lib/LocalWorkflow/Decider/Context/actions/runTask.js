function runTask(taskName, input) {
  const task = this.data.tasks[taskName]

  return task.apply(task, input)
}

export default runTask
