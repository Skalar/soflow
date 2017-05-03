async function Timers({
  actions: {
    timer,
  }
}) {
  let result = 'incorrect'
  const {startTime} = await timer({id: 'timeout', seconds: 2, data: {startTime: Date.now()}})

  if (Date.now() - startTime >= 2000) {
    result = 'correct'
  }

  return result
}

export default Timers
