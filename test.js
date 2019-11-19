const semver = require('semver')
const version = process.versions.node

if (semver.satisfies(version, '>= 10.0.0')) {
  module.exports = require('./test/helpers')
} else {
  throw new Error('NodeJS 10.0.0 or newer is required')
}
