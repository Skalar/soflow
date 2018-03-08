const test = require('ava')
const incomingSignals = require('./incomingSignals')

test('no signals', async t => {
  const state = incomingSignals()

  t.deepEqual(
    state,
    {},
    'returns an empty object when no state and events provided'
  )
})

test('one received signal', async t => {
  const state = incomingSignals(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01'),
      eventType: 'WorkflowExecutionSignaled',
      workflowExecutionSignaledEventAttributes: {
        signalName: 'testSignal',
        input: JSON.stringify({my: 'data'}),
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testSignal: [
        {
          receivedAt: new Date('2018-01-01'),
          input: {my: 'data'},
        },
      ],
    },
    'one received signal'
  )
})

test('two signals with same name', async t => {
  const state = incomingSignals(undefined, [
    {
      eventId: 1,
      eventTimestamp: new Date('2018-01-01'),
      eventType: 'WorkflowExecutionSignaled',
      workflowExecutionSignaledEventAttributes: {
        signalName: 'testSignal',
        input: JSON.stringify({my: 'data'}),
      },
    },
    {
      eventId: 2,
      eventTimestamp: new Date('2018-01-02'),
      eventType: 'WorkflowExecutionSignaled',
      workflowExecutionSignaledEventAttributes: {
        signalName: 'testSignal',
        input: JSON.stringify({my: 'otherdata'}),
      },
    },
  ])

  t.deepEqual(
    state,
    {
      testSignal: [
        {
          receivedAt: new Date('2018-01-01'),
          input: {my: 'data'},
        },
        {
          receivedAt: new Date('2018-01-02'),
          input: {my: 'otherdata'},
        },
      ],
    },
    'two recevied signals with the same name'
  )
})
