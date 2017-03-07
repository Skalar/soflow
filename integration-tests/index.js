import {SWF} from '~/lib'
import test from 'blue-tape'
import AWS from 'aws-sdk'

const lambda = new AWS.Lambda({region: 'eu-west-1'})

const {
  SWF_DOMAIN: domain,
  SOFLOW_NAMESPACE: namespace,
  SOFLOW_VERSION: version,
} = process.env

const switches = process.argv.slice(2)

if (!switches.includes('--no-setup')) {
  test('Setting up Cloudformation stack... (takes 2-3 min)', async t => {
    await SWF.deploy({
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
      ]
    })

    t.pass('done')
  })
}

test('Invoking SWF decider lambda function', async t => {
  await lambda.invoke({
    FunctionName: `${namespace}_decider`,
    InvocationType: 'Event',
  }).promise()

  t.pass('done')
})

try {
  require('./workflows/SimpleMath.swf.test')
  require('./workflows/DeciderException.swf.test')
  require('./workflows/LambdaFailure.swf.test')
}
catch (error) {
  console.log('error', error)
}

if (!switches.includes('--no-teardown')) {
  test('Teardown (takes 2-3 min)', async t => {
    await SWF.teardown({namespace})
    t.pass('done')
  })
}
