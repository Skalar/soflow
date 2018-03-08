const semver = require('semver')
const version = process.versions.node

if (semver.satisfies(version, '>= 9.0.0')) {
  module.exports = require('./test/helpers')
} else if (semver.satisfies(version, '>= 6.5.0')) {
  module.exports = require('./test-6_13_0/helpers')
} else {
  throw new Error('NodeJS 6.5.0 or newer is required')
}
