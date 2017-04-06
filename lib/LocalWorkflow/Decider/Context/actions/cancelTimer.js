function cancelTimer(name, _clearTimeout = clearTimeout) {
  _clearTimeout(this._timers[name])

  delete this._timers[name]
}

export default cancelTimer
