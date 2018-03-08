#!/usr/bin/env node

const {SWF} = require('soflow')

async function teardown() {
  if (!process.env.PROFILES || process.env.PROFILES.includes('swf')) {
    await SWF.terminateAllExecutions()
    await SWF.Orchestration.teardown({
      removeBucket: false,
      progressIndicator: true,
    })
  }
}

if (require.main === module) {
  teardown().catch(error => {
    console.dir(error)
    process.exit(0)
  })
}
