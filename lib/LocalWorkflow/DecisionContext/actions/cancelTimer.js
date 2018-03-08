function cancelTimer(context, id) {
  const timer = context.state.timers[id]

  if (!timer) {
    throw new Error('No such timer')
  }

  timer.cancel()
}

module.exports = cancelTimer
