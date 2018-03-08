async function Timers({
  actions: {timer, cancelTimer},
  input: {cancelTimer: shouldCancelTimer = false} = {},
}) {
  let data = 'initial'

  timer({id: 'mytimer', seconds: 2, data: 'testdata'}).then(
    payload => (data = payload)
  )

  await timer({id: 'wait-before-cancelling', seconds: 1})

  if (shouldCancelTimer) {
    await cancelTimer('mytimer')
  }
  await timer({id: 'give-other-timer-chance-to-fire', seconds: 1})

  return {data}
}

module.exports = Timers
