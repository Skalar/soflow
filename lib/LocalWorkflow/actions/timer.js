function timer({seconds, id = Math.random().toString(), _setTimeout = setTimeout, data}) {
  return new Promise(resolve => {
    this.soflow.timers[id] = _setTimeout(() => {
      delete this.soflow.timers[id]
      resolve(data)
    }, seconds * 1000)
  })
}

export default timer
