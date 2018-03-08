function timer(
  context,
  {id = Math.random().toString(), seconds, data} = {},
  _setTimeout = setTimeout,
  _clearTimeout = clearTimeout
) {
  if (context.state.timers[id]) {
    throw new Error('Timer already exists')
  }

  return new Promise(resolve => {
    const timer = {}
    context.state.timers[id] = timer
    timer.id = _setTimeout(() => {
      delete context.state.timers[id]
      resolve(data)
    }, seconds * 1000)
    timer.cancel = () => {
      clearTimeout(timer.id)
      delete context.state.timers[id]
    }
  })
}

module.exports = timer
