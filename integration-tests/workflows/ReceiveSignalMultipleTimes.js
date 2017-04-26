async function ReceiveSignalMultipleTimes({actions}) {
  const {receiveSignal} = actions

  const payload1 = await receiveSignal('receiveSignalTest')
  const payload2 = await receiveSignal('receiveSignalTest')

  return [payload1, payload2]
}

export default ReceiveSignalMultipleTimes
