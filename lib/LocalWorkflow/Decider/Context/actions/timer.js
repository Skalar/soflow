function timer(seconds, name = Math.random().toString(), _setTimeout = setTimeout) {
  return new Promise(resolve => {
    this.timers[name] = _setTimeout(() => {
      delete this.timers[name]
      resolve()
    }, seconds * 1000)
  })
}

export default timer
