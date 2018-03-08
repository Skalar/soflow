async function brieflyWaitForPromise(promise) {
  let result, error

  promise
    .then(res => (result = res || 'no result'))
    .catch(err => (error = err || 'no error'))

  await new Promise(resolve => setImmediate(resolve))

  return {result, error}
}

module.exports = brieflyWaitForPromise
