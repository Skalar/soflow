async function IncomingSignals({actions: {incomingSignal}}) {
  const testSignal1 = await incomingSignal('testSignal')
  const testSignal2 = await incomingSignal('testSignal')
  const otherSignal1 = await incomingSignal('otherSignal')

  return {testSignal1, testSignal2, otherSignal1}
}

module.exports = IncomingSignals
