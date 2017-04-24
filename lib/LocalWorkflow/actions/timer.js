function timer(seconds, name = Math.random().toString(), _setTimeout = setTimeout) {
  return new Promise(resolve => {
    this.soflow.timers[name] = _setTimeout(() => {
      delete this.soflow.timers[name]
      resolve()
    }, seconds * 1000)
  })
}

export default timer
