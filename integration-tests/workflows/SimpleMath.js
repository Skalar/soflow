async function SimpleMath({
  input,
  tasks: {
    doubleNumber
  }
}) {
  const doubledNumber = await doubleNumber(input)
  const twiceDoubledNumber = await doubleNumber(doubledNumber)

  return twiceDoubledNumber
}

export default SimpleMath
