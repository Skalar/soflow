function timer(seconds, name = Math.random().toString(), _setTimeout = setTimeout) {
  return new Promise(resolve => {
    this._timers[name] = _setTimeout(() => {
      delete this._timers[name]
      resolve()
    }, seconds * 1000)
  })
}

export default timer
