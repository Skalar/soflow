function cancelTimer(name, _clearTimeout = clearTimeout) {
  _clearTimeout(this.soflow.timers[name])

  delete this.soflow.timers[name]
}

export default cancelTimer
