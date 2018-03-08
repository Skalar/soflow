function incomingSignal(context, signalName) {
  return new Promise(resolve => {
    const index = context.counter('incomingSignal', signalName)
    const signals = context.state.incomingSignals[signalName]

    if (signals && signals[index]) {
      resolve(signals[index])
    }
  })
}

module.exports = incomingSignal
