#!/usr/bin/env node

import {SWF} from '~/lib'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
  SOFLOW_VERSION: version,
} = process.env

async function teardown() {
  await SWF.DevOps.shutdownDeciders({
    namespace,
    domain,
    version,
  })

  await SWF.DevOps.terminateWorkflows({
    domain,
    namespace,
  })

  await SWF.DevOps.teardownWithSpinner({
    namespace,
    domain,
  })
}

if (require.main === module) {
  teardown().catch(error => {
    console.dir(error)
    process.exit(0)
  })
}
