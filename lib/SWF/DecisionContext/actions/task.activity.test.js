const test = require('ava')
const task = require('./task')
const {brieflyWaitForPromise} = require('soflow/test')

async function runAction(state = {activityTasks: {}}) {
  const context = {
    namespace: 'test',
    state: {
      workflowExecution: {
        workflowType: {
          version: '2',
        },
        taskList: 'test_2',
      },
      ...state,
    },
    decisions: [],
  }

  const {error, result} = await brieflyWaitForPromise(
    task(context, {
      name: 'testActivity',
      id: 'testActivity',
      args: [{hey: 'ho'}],
    })
  )

  return {error, result, decisions: context.decisions}
}
test('not scheduled', async t => {
  const {result, error, decisions} = await runAction()

  t.deepEqual(
    decisions,
    [
      {
        decisionType: 'ScheduleActivityTask',
        scheduleActivityTaskDecisionAttributes: {
          activityId: 'testActivity',
          activityType: {name: 'testActivity', version: '2'},
          heartbeatTimeout: 'NONE',
          input: JSON.stringify([{hey: 'ho'}]),
          taskList: {name: 'test_2'},
        },
      },
    ],
    'makes a decision to schedule activity task'
  )

  t.is(error, undefined, 'promise is not rejected')
  t.is(result, undefined, 'promise does not resolve')
})

test('schedule failed', async t => {
  const {result, error, decisions} = await runAction({
    activityTasks: {
      testActivity: {
        status: 'scheduleFailed',
        cause: 'OPERATION_NOT_PERMITTED',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: ActivityTask failed to schedule: OPERATION_NOT_PERMITTED',
    'provides a sensible rejection error'
  )
})

test('scheduled', async t => {
  const {result, error, decisions} = await runAction({
    activityTasks: {
      testActivity: {
        status: 'scheduled',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.is(error, undefined, 'promise is not rejected')
})

test('timed out', async t => {
  const {result, error, decisions} = await runAction({
    activityTasks: {
      testActivity: {
        status: 'timedOut',
        timeoutType: 'START_TO_CLOSE',
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(result, undefined, 'promise does not resolve')
  t.truthy(error, 'promise is rejected')
  t.is(
    error.toString(),
    'Error: ActivityTask timed out: START_TO_CLOSE',
    'provides a sensible rejection error'
  )
})

test('completed', async t => {
  const {result, error, decisions} = await runAction({
    activityTasks: {
      testActivity: {
        status: 'completed',
        result: {my: 'result'},
      },
    },
  })

  t.deepEqual(decisions, [], 'does not make any decisions')
  t.is(error, undefined, 'promise is not rejected')
  t.truthy(result, 'promise is resolved')
  t.deepEqual(result, {my: 'result'}, 'resolves with the result')
})
