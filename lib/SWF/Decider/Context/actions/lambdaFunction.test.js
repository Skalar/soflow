import test from 'blue-tape'
import lambdaFunction from './lambdaFunction'


function run({context: givenContext, name, input}) {
  const context = {
    namespace: 'test',
    ref: 0,
    decisions: [],
    state: {
      lambdaFunction: {}
    },
    ...givenContext
  }

  return {
    promise: lambdaFunction.apply(context, [name, input]),
    context,
  }
}


test('SWF.Decider.Context.actions.lambdaFunction()', {timeout: 1000}, async t => {
  {
    const {context} = run({name: 'myTask', input: [2]})

    t.deepEquals(
      context.decisions,
      [
        {
          decisionType: 'ScheduleLambdaFunction',
          scheduleLambdaFunctionDecisionAttributes: {
            id: '1',
            name: 'test_myTask',
            input: '[2]',
            startToCloseTimeout: 'NONE'
          }
        }
      ],
      'schedules the lambda function'
    )
  }

  {
    const {promise} = run({
      context: {
        state: {
          lambdaFunction: {
            1: {
              state: {name: 'completed', result: JSON.stringify(4)}
            }
          }
        }
      },
      name: 'myTask'
    })

    t.isEqual(
      await promise,
      4,
      'resolves the promise with the result'
    )
  }
})
