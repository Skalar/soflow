const semver = require('semver')
const version = process.versions.node

if (semver.satisfies(version, '>= 9.0.0')) {
  module.exports = require('./lib')
} else if (semver.satisfies(version, '>= 6.5.0')) {
  module.exports = require('./lib-6_13_0')
} else {
  throw new Error('NodeJS 6.5.0 or newer is required')
}
