class TimerError extends Error {}

async function cancelTimer(id) {
  const timer = this.state.timer[id]

  if (!timer) {
    throw new Error(`Timer with ${id} is not known`)
  }

  switch (timer.state.name) {
    case 'cancelFailed': {
      throw new TimerError(timer.state.cause)
    }
    case 'canceled': {
      return id
    }
  }

  this.decisions.push({
    decisionType: 'CancelTimer',
    cancelTimerDecisionAttributes: {timerId: id}
  })
}

export default cancelTimer
