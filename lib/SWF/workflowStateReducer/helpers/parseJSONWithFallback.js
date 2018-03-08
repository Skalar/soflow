function parseJSONWithFallback(str) {
  try {
    return JSON.parse(str)
  } catch (error) {
    return str
  }
}

module.exports = parseJSONWithFallback
