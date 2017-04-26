async function SimpleMath({
  input,
  tasks: {
    doubleNumber
  }
}) {
  await doubleNumber(input)
}

export default SimpleMath
