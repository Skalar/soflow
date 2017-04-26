import test from 'blue-tape'
import SignalReceived from './SignalReceived'

function createEvent(input) {
  return {
    eventId: 1,
    eventType: 'WorkflowExecutionSignaled',
    workflowExecutionSignaledEventAttributes: {
      signalName: 'mySignal',
      input
    }
  }
}

test('SWF.WorkflowHistory.SignalReceived', {timeout: 1000}, async t => {
  t.deepEqual(
    SignalReceived([
      createEvent('42'),
    ]).mySignal,
    {
      inputList: ['42'],
      state: {name: 'received', receivedCount: 1},
    },
    'received signal'
  )
})

test('SWF.WorkflowHistory.SignalReceived with multiple events', {timeout: 1000}, async t => {
  t.deepEqual(
    SignalReceived([
      createEvent('A for Apple'),
      createEvent('B for Banana... mmm'),
    ]).mySignal,
    {
      inputList: ['A for Apple', 'B for Banana... mmm'],
      state: {name: 'received', receivedCount: 2},
    },
    'received multiple signals'
  )
})
