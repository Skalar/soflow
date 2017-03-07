async function LambdaFailure({lambdaFunctions}) {
  const {failTask} = lambdaFunctions

  await failTask()
}

export default LambdaFailure
