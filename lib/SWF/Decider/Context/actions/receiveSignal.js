function receiveSignal(signalName) {
  const signal = this.state.signalReceived[signalName]

  return new Promise((resolve) => {
    if (signal && signal.state.name === 'received') {
      if (signal.inputList.length > 0) {
        const input = signal.inputList.shift()
        return resolve(JSON.parse(input))
      }
    }
  })
}

export default receiveSignal
