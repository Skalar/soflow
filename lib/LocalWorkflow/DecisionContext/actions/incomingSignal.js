function incomingSignal(context, signalName) {
  return context.awaitSignal(signalName)
}

module.exports = incomingSignal
