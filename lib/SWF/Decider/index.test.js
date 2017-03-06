import test from 'blue-tape'
import proxyquire from 'proxyquire'

const swf = {}

const AWS = {
  SWF() {
    return swf
  }
}

const Decider = proxyquire(
  './index',
  {
    '@noCallThru': true,
    'aws-sdk': AWS,
  }
).default

test('SWF.Decider', {timeout: 1000}, async t => {
  t.plan(3)

  swf.pollForDecisionTask = () => {
    t.pass('polls for a decision task')

    return {
      promise() {
        return Promise.resolve({
          taskToken: 'token',
          startedEventId: 1,
          workflowExecution: {
            workflowId: '',
            runId: '',
          },
          workflowType: {
            name: 'myWorkflow',
            version: 'latest',
          },
          events: [
            {
              fuck: true,
            }
          ],
          nextPageToken: '',
          previousStartedEventId: '',
        })
      }
    }
  }

  swf.respondDecisionTaskCompleted = () => {
    t.pass('completes the decision task')

    return {
      promise() {
        return Promise.resolve({})
      }
    }
  }

  await new Promise((resolve, reject) => {
    Decider(
      {
        domain: 'SoFlow',
        namespace: 'test',
        version: 'test',
        workflows: {
          myWorkflow: async () => {
            t.pass('executes the workflow decider function')
          }
        },
        tasks: {}
      },
      {
        getRemainingTimeInMillis() {
          this.counter = (this.counter || 0) + 1

          if (this.counter > 1) {
            return 0
          }
          return 70000
        }
      },
      (err, result) => {
        return err ? reject(err) : resolve(result)
      }
    )
  })
})
