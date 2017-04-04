function cancelTimer(name, _clearTimeout = clearTimeout) {
  _clearTimeout(this.timers[name])
  delete this.timers[name]
}

export default cancelTimer
