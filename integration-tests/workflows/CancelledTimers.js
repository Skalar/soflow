async function CancelledTimers({
  actions: {
    timer,
    cancelTimer,
  }
}) {
  let result = 'correct'
  timer({id: 'timerToBeCancelled', seconds: 2, data: null})
    .then(() => {
      result = 'incorrect'
    })
  await timer({id: 'pauseBeforeCancelTimer', seconds: 1, data: null})

  cancelTimer('timerToBeCancelled')
  // This gives the timer that should be cancelled enough time to complete if
  // for whatever reason it was not cancelled.
  await timer({id: 'timeout', seconds: 2, data: null})

  return result
}

export default CancelledTimers
