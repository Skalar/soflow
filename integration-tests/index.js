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


test('Setup (takes a while)', async t => {
  if (!switches.includes('--no-setup')) {
    await setup()
    t.pass('create CloudFormation stack')
  } else {
    t.pass('skipping CloudFormation stack creation')
  }

  await lambda.invoke({
    FunctionName: `${namespace}_decider`,
    InvocationType: 'Event',
  }).promise()

  t.pass('invoke decider')
})

try {
  require('./SWF/basic-workflow.test')
}
catch (error) {
  console.log('error', error)
}

test('Teardown (takes a while)', async t => {
  if (!switches.includes('--no-teardown')) {
    await teardown()
    t.pass('delete CloudFormation stack')
  } else {
    t.pass('skip CloudFormation stack deletion')
  }
})

function setup() {
  return SWF.deploy({
    namespace,
    domain,
    version,
    workflowsPath: 'integration-tests/TestProject/workflows',
    tasksPath: 'integration-tests/TestProject/tasks',
    files: [
      'node_modules/**',
      'lib/**',
      'integration-tests/**',
      'package.json',
    ]
  })
}

function teardown() {
  return SWF.teardown({namespace})
}
