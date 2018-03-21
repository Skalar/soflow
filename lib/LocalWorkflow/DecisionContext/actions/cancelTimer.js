function cancelTimer(context, id, {fail = false} = {}) {
  const timer = context.state.timers[id]

  if (!timer) {
    if (fail) {
      throw new Error('No such timer')
    }
  } else {
    timer.cancel()
  }
}

module.exports = cancelTimer
