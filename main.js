const semver = require('semver')
const version = process.versions.node

if (semver.satisfies(version, '>= 9.0.0')) {
  module.exports = require('./lib')
} else if (semver.satisfies(version, '>= 6.5.0')) {
  module.exports = require('./lib-8_10_0')
} else {
  throw new Error('NodeJS 8.10.0 or newer is required')
}
