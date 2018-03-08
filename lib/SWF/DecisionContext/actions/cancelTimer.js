function cancelTimer(context, id) {
  return new Promise((resolve, reject) => {
    const timer = context.state.timers[id]

    if (!timer) {
      throw new Error('There is no such timer')
    } else {
      switch (timer.status) {
        case 'started': {
          context.decisions.push({
            decisionType: 'CancelTimer',
            cancelTimerDecisionAttributes: {timerId: id},
          })
          return resolve()
        }
        case 'cancelFailed': {
          return reject(new Error(`Failed to cancel timer (${timer.cause})`))
        }
        case 'canceled': {
          return resolve()
        }
        default: {
          return reject(
            new Error(`Cannot cancel timer with status "${timer.status}"`)
          )
        }
      }
    }
  })
}

module.exports = cancelTimer
