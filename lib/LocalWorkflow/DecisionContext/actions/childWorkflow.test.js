const test = require('ava')
const DecisionContext = require('../')

test('childWorkflow success', async t => {
  t.plan(2)

  const context = new DecisionContext({
    workflows: {
      MyWorkflow(context) {
        t.deepEqual(
          context.input,
          {my: 'data'},
          'provides the child workflow with the correct input'
        )
        return {my: 'result'}
      },
    },
    tasks: {},
  })

  const result = await context.actions.childWorkflow({
    id: 'workflowId',
    type: 'MyWorkflow',
    input: {my: 'data'},
  })

  t.deepEqual(result, {my: 'result'}, 'resolves with the workflow result')
})

test('failure', async t => {
  t.plan(1)

  const context = new DecisionContext({
    workflows: {
      async MyWorkflow() {
        throw new Error('Something happened')
      },
    },
    tasks: {},
  })

  try {
    await context.actions.childWorkflow({
      id: 'workflowId',
      type: 'MyWorkflow',
      input: {my: 'data'},
    })
  } catch (error) {
    t.is(
      error.toString(),
      'Error: There is already an active workflow with id = workflowId',
      'forwards the error from the child workflow'
    )
  }
})
