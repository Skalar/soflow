import test from 'blue-tape'
import SignalReceived from './SignalReceived'

const events = {
  received: {
    eventId: 1,
    eventType: 'WorkflowExecutionSignaled',
    workflowExecutionSignaledEventAttributes: {
      signalName: 'mySignal',
      input: '42'
    }
  },
}

test('SWF.WorkflowHistory.SignalReceived', {timeout: 1000}, async t => {
  t.deepEqual(
    SignalReceived([
      events.received,
    ]).mySignal,
    {
      input: '42',
      state: {name: 'received', input: '42'},
    },
    'received signal'
  )
})
