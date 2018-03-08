function dummy({error, result}) {
  if (error) {
    const constructedError = new Error(error.message)
    Object.assign(constructedError, error)
    throw constructedError
  } else {
    return result
  }
}

dummy.config = {
  type: 'both',
  scheduleToStartTimeout: 30,
  startToCloseTimeout: 10,
}

module.exports = dummy
