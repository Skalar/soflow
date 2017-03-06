async function SimpleMath({input, lambdaFunctions}) {
  const {doubleNumber} = lambdaFunctions

  const doubledNumber = await doubleNumber(input)
  const twiceDoubledNumber = await doubleNumber(doubledNumber)

  return twiceDoubledNumber
}

export default SimpleMath
