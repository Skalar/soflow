async function ReceiveSignal({actions}) {
  const {receiveSignal} = actions

  const payload = await receiveSignal('receiveSignalTest')

  return payload
}

export default ReceiveSignal
