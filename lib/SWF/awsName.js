const {createHash} = require('crypto')

function shortenIdentifier(str, maxLength, hexLength = 5) {
  if (str.length <= maxLength) return str

  const hexHash = createHash('sha1')
    .update(str)
    .digest('hex')

  return [
    str.substr(0, maxLength - hexLength - 1),
    hexHash.substr(0, hexLength),
  ].join('_')
}

function role(str) {
  return shortenIdentifier(str, 64)
}

function lambda(str) {
  return shortenIdentifier(str, 64)
}

function rule(str) {
  return shortenIdentifier(str, 64)
}

module.exports = {
  role,
  lambda,
  rule,
}
