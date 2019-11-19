import soflow from 'soflow'
const testProfiles = require('./helpers/testProfiles')

testProfiles('custom lambda decider environment variables', async (t, {profileName}) => {
  if (profileName === 'local') {
    t.truthy(true, 'Skipping test for local profile')
    return
  }
  const lambda = new soflow.config.AWS.Lambda()
  const {Configuration: {Environment: {Variables}}} = await lambda
    .getFunction({
      FunctionName: `${soflow.config.namespace}_decider`,
      Qualifier: 'test',
    })
    .promise()

  t.is(
    Variables.MY_FIRST_VARIABLE,
    'test',
    'allows setting custom env var'
  )
  t.is(
    Variables.MY_SECOND_VARIABLE,
    'ing',
    'allows setting multiple env variables'
  )
})
