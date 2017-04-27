async function Timers({
  actions: {
    timer,
    cancelTimer,
  }
}) {
  let result = 'correct'
  timer({id: 'timeout', seconds: 2, data: {my: 'data'}}).then(
    () => { result = 'incorrect' }
  )
  await timer({id: 'waitForCancellation', seconds: 1})

  cancelTimer('timeout')

  return result
}

export default Timers
