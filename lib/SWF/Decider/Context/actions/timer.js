class TimerError extends Error {}

async function timer({id, seconds, data}) {
  const timer = this.state.timer[id]

  if (!timer) {
    this.decisions.push({
      decisionType: 'StartTimer',
      startTimerDecisionAttributes: {
        startToFireTimeout: seconds.toString(),
        timerId: id,
        control: JSON.stringify(data)
      }
    })
  }
  else {
    switch (timer.state.name) {
      case 'startFailed': {
        const {cause} = timer.state
        const error = new TimerError(cause)

        throw error
      }
      case 'cancelFailed': {
        const {cause} = timer.state
        throw new TimerError(cause)
      }
      case 'fired': {
        try {
          return JSON.parse(timer.control)
        }
        catch (error) {
          return timer.control
        }
      }
      case 'started':
      case 'canceled':
    }
  }

  return new Promise(() => {}) // eslint-disable-line
}

export default timer
