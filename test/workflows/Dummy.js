async function Dummy({input: {taskOptions}, actions: {task}}) {
  const result = await task({name: 'dummy', ...taskOptions})

  return result
}

module.exports = Dummy
