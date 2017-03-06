export function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms))
}

export function timeout(ms = 0) {
  return new Promise(r => setTimeout(r, ms))
}
