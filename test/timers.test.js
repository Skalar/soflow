const testProfiles = require('./helpers/testProfiles')

testProfiles('Timer fired', async (t, {executeWorkflow}) => {
  const execution = await executeWorkflow({
    type: 'Timers',
    workflowId: 'timer-fired',
  })

  const {data} = await execution.promise

  t.deepEqual(data, 'testdata', 'the timer fires with the given payload')
})

testProfiles('Timer canceled', async (t, {executeWorkflow}) => {
  const execution = await executeWorkflow({
    type: 'Timers',
    workflowId: 'canceled-timer',
    input: {cancelTimer: true},
  })

  const {data} = await execution.promise

  t.deepEqual(data, 'initial', 'timer does not fire')
})
