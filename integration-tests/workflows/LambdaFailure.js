async function LambdaFailure({
  tasks: {
    failTask,
  }
}) {
  await failTask()
}

export default LambdaFailure
