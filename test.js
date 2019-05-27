const semver = require('semver')
const version = process.versions.node

if (semver.satisfies(version, '>= 9.0.0')) {
  module.exports = require('./test/helpers')
} else if (semver.satisfies(version, '>= 8.10.0')) {
  module.exports = require('./test-8_10_0/helpers')
} else {
  throw new Error('NodeJS 8.10.0 or newer is required')
}
