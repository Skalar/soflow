const test = require('ava')
const workflowExecution = require('./workflowExecution')

test('without any events', async t => {
  const state = workflowExecution()

  t.deepEqual(state, {}, 'returns an empty object')
})

test('workflow started', async t => {
  const state = workflowExecution(undefined, [
    {
      eventId: 1,
      eventType: 'WorkflowExecutionStarted',
      workflowExecutionStartedEventAttributes: {
        input: JSON.stringify({my: 'data'}),
        taskList: {
          name: 'test',
        },
      },
    },
  ])

  t.deepEqual(
    state,
    {
      input: {my: 'data'},
      taskList: 'test',
    },
    'started'
  )
})
