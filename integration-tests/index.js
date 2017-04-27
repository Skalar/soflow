import {SWF} from '~/lib'
import test from 'blue-tape'

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
  SOFLOW_VERSION: version,
} = process.env

const switches = process.argv.slice(2)

if (!switches.includes('--no-setup')) {
  test('⚙  SWF Deployment', async t => {
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
      enableDeciderSchedule: false,
    })
    t.comment('Giving AWS some time to get up and running...')
    await new Promise(resolve => setTimeout(resolve, 10000))
  })
}

test('⚙  Invoking SWF decider lambda function', async t => {
  await SWF.DevOps.invokeDecider({
    namespace,
    version,
  })

  t.pass(`Invoked decider for ${namespace}@${version}`)
})

try {
  require('./workflows/SimpleMath.swf.test')
  require('./workflows/DeciderException.swf.test')
  require('./workflows/LambdaFailure.swf.test')
  require('./workflows/ReceiveSignal.swf.test')
  require('./workflows/Timers.swf.test')
}
catch (error) {
  console.log('error', error)
}

if (!switches.includes('--no-teardown')) {
  test('⚙  SWF teardown', async () => {
    await SWF.DevOps.teardownWithSpinner({
      namespace,
      domain,
    })
  })
}
