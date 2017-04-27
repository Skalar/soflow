import test from 'blue-tape'
import childWorkflow from './childWorkflow'


function run(childWorkflowParams, givenContext = {}) {
  const context = {
    namespace: 'test',
    decisions: [],
    ...givenContext,
    state: {
      childWorkflow: {},
      workflowExecution: {
        workflowType: {
          version: 'tests',
        },
        tagList: ['myTag'],
        taskStartToCloseTimeout: '5',
        lambdaRole: 'swfLambdaRole',
      },
      ...givenContext.state,
    }
  }

  return {
    promise: childWorkflow.apply(context, [childWorkflowParams]),
    context,
  }
}


test('SWF.Decider.Context.actions.childWorkflow()', {timeout: 1000}, async t => {
  {
    const {context} = run({
      id: 'mychildworkflow',
      type: 'ChildWorkflow',
      input: {
        my: 'input'
      }
    })

    t.deepEquals(
      context.decisions,
      [
        {
          decisionType: 'StartChildWorkflowExecution',
          startChildWorkflowExecutionDecisionAttributes: {
            childPolicy: 'TERMINATE',
            control: undefined,
            executionStartToCloseTimeout: '600',
            input: JSON.stringify({my: 'input'}),
            lambdaRole: 'swfLambdaRole',
            tagList: ['myTag'],
            taskStartToCloseTimeout: '5',
            taskPriority: undefined,
            workflowId: 'mychildworkflow',
            workflowType: {
              name: 'test_ChildWorkflow',
              version: 'tests'
            }
          }
        }
      ],
      'makes decision'
    )
  }

  {
    const {promise} = run(
      {
        id: 'mychildworkflow',
        type: 'ChildWorkflow',
        input: {
          my: 'input'
        }
      },
      {
        state: {
          childWorkflow: {
            ChildWorkflow_mychildworkflow: {
              state: {name: 'completed', result: 4}
            }
          }
        }
      }
    )

    t.isEqual(
      await promise,
      4,
      'resolves the promise with the result'
    )
  }
})
