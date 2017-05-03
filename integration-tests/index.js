import {SWF} from '~/lib'
import test from 'blue-tape'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
  SOFLOW_VERSION: version,
} = process.env

const switches = process.argv.slice(2)

if (!switches.includes('--no-setup')) {
  test('⚙  SWF Deployment', async () => {
    await SWF.DevOps.deployWithSpinner({
      namespace,
      domain,
      version,
      workflowsPath: 'integration-tests/workflows',
      tasksPath: 'integration-tests/tasks',
      files: [
        'node_modules/**',
        'lib/**',
        'integration-tests/**',
        'package.json',
      ],
      soflowRoot: '.',
      createBucket: true,
      enableDeciderSchedule: true,
    })
  })
}

test('⚙  Invoking SWF decider lambda function', async t => {
  await SWF.DevOps.invokeDecider({
    namespace,
    version,
  })
  await new Promise(resolve => setTimeout(resolve, 2000))

  t.pass(`Invoked decider for ${namespace}@${version}`)
})

try {
  require('./workflows/SimpleMath.swf.test')
  require('./workflows/DeciderException.swf.test')
  require('./workflows/LambdaFailure.swf.test')
  require('./workflows/ReceiveSignal.swf.test')
}
catch (error) {
  console.log('error', error)
}

test('⚙  Cleanup', async t => {
  await SWF.DevOps.shutdownDeciders({
    namespace,
    domain,
    version,
  })

  t.pass('Sent signals to deciders to shut down')

  await SWF.DevOps.terminateWorkflows({
    domain,
    namespace,
  })

  t.pass('Terminated workflows')

  if (!switches.includes('--no-teardown')) {
    await SWF.DevOps.teardownWithSpinner({
      namespace,
      domain,
    })

    if (!switches.includes('--skip-teardown-wait')) {
      const AWS_TEARDOWN_WAIT = 60
      console.log(`Waiting ${AWS_TEARDOWN_WAIT} seconds for AWS to complete teardown.`)

      await new Promise(resolve => setTimeout(resolve, AWS_TEARDOWN_WAIT * 1000))
    }
  }
})
