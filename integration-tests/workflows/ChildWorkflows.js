async function ChildWorkflows({
  workflows: {
    SimpleMath,
  }
}) {
  const firstResult = await SimpleMath({id: 'first', input: 5})
  const secondResult = await SimpleMath({id: 'second', input: 2})

  return {firstResult, secondResult}
}

export default ChildWorkflows
