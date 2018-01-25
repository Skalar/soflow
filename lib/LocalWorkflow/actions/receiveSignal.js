function receiveSignal(signalName) {
  return new Promise(resolve => {
    const loop = setInterval(() => {
      if (Array.isArray(this.soflow.receivedSignals[signalName])) {
        if (this.soflow.receivedSignals[signalName].length > 0) {
          clearInterval(loop)
          resolve(this.soflow.receivedSignals[signalName].shift())
        }
      }
    }, 50)
  })
}

export default receiveSignal
