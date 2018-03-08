function timer(context, {id, seconds, data} = {}) {
  return new Promise((resolve, reject) => {
    const timer = context.state.timers[id]

    if (!timer) {
      context.decisions.push({
        decisionType: 'StartTimer',
        startTimerDecisionAttributes: {
          startToFireTimeout: seconds.toString(),
          timerId: id,
          control: JSON.stringify(data),
        },
      })
    } else {
      switch (timer.status) {
        case 'startFailed': {
          const error = new Error(`Timer failed to start (${timer.cause})`)
          error.code = 'StartTimerFailed'
          error.cause = timer.cause

          return reject(error)
        }
        case 'fired': {
          return resolve(timer.data)
        }
        case 'cancelFailed': // this is for cancelTimer()        }
        case 'started': // we need to wait
        case 'canceled':
      }
    }
  })
}

module.exports = timer
