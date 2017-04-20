function receiveSignal(signalName) {
  const signal = this.state.signalReceived[signalName]

  return new Promise((resolve) => {
    if (signal) {
      switch (signal.state.name) {
        case 'received': {
          return resolve(JSON.parse(signal.input))
        }
      }
    }
  })
}

export default receiveSignal
