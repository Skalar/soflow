const config = require('../../lib/config')
const test = require('ava')
const bunyan = require('bunyan')

const SoFlow = require('soflow')
const workflows = require('../workflows')
const tasks = require('../tasks')

function generateTaskListName(name) {
  return `${config.namespace}-${name}-${Math.random()
    .toString(36)
    .substring(2, 15)}`
}

async function testProfiles(description, ...rest) {
  const fn = rest[rest.length - 1]
  const codeRoot = '/soflow'
  const workflowsPath = `${['test', process.env.NODE_TARGET]
    .filter(v => v)
    .join('-')}/workflows`
  const tasksPath = `${['test', process.env.NODE_TARGET]
    .filter(v => v)
    .join('-')}/tasks`

  const profiles = process.env.PROFILES
    ? process.env.PROFILES.split(/\s+/)
    : ['swf', 'swf-lambda', 'local']

  const {timeout = 10000, only = false} = rest.length > 1 ? rest[0] : {}
  const registerTest = only ? test.only : test

  //
  //  'swf' profile
  //
  if (profiles.includes('swf')) {
    const taskList = generateTaskListName('swf')
    const prefix = str => [taskList, str].join('_')

    registerTest(`[swf] ${description}`, async t => {
      let activityWorker, deciderWorker

      try {
        deciderWorker = new SoFlow.SWF.DeciderWorker({
          taskList,
          workflows,
          tasks,
          logger: bunyan.createLogger({
            name: 'soflow-tests',
            level: process.env.LOG_LEVEL || 'error',
            component: 'DeciderWorker',
          }),
          concurrency: 2,
        })
        deciderWorker.start()

        activityWorker = new SoFlow.SWF.ActivityWorker({
          taskList,
          workflows,
          tasks,
          logger: bunyan.createLogger({
            name: 'soflow-tests',
            level: process.env.LOG_LEVEL || 'error',
            component: 'ActivityWorker',
          }),
          concurrency: 2,
        })
        activityWorker.start()

        // Run the test itself
        await fn(t, {
          taskList,
          backend: SoFlow.SWF,
          async executeWorkflow({workflowId, ...params}) {
            return await SoFlow.SWF.executeWorkflow({
              startToCloseTimeout: timeout / 1000,
              taskList,
              prefixWorkflowId: false, // we should use prefix()
              workflowId: prefix(workflowId),
              ...params,
            })
          },

          prefix,
        })
      } finally {
        if (activityWorker) activityWorker.stop({abort: true})
        if (deciderWorker) deciderWorker.stop({abort: true})
      }
    })
  }

  //
  //  'swf-lambda' rofile
  //
  if (profiles.includes('swf-lambda')) {
    const taskList = generateTaskListName('swf-lambda')
    const prefix = str => [taskList, str].join('_')
    registerTest(`[swf-lambda] ${description}`, async t => {
      let activityWorker

      try {
        SoFlow.SWF.Orchestration.Lambda.invokeDecider({taskList})

        activityWorker = new SoFlow.SWF.ActivityWorker({
          taskList,
          workflows,
          tasks,
          logger: bunyan.createLogger({
            name: 'soflow-tests',
            level: process.env.LOG_LEVEL || 'error',
            component: 'ActivityWorker',
          }),
          concurrency: 2,
        })

        activityWorker.start()

        // Run the test itself
        await fn(t, {
          taskList,
          backend: SoFlow.SWF,
          async executeWorkflow({workflowId, ...params}) {
            return await SoFlow.SWF.executeWorkflow({
              startToCloseTimeout: timeout / 1000,
              taskList,
              prefixWorkflowId: false, // we should use prefix()
              workflowId: prefix(workflowId),
              ...params,
            })
          },
          prefix,
        })
      } finally {
        if (activityWorker) activityWorker.stop({abort: true})

        await SoFlow.SWF.Orchestration.Lambda.shutdownDeciders({taskList})
      }
    })
  }

  //
  //  'local' profile
  //
  if (profiles.includes('local')) {
    const taskList = generateTaskListName('local')
    const prefix = str => [taskList, str].join('_')
    registerTest(`[local] ${description}`, async t => {
      await fn(t, {
        taskList,
        backend: SoFlow.LocalWorkflow,

        async executeWorkflow({workflowId, ...params}) {
          return await SoFlow.LocalWorkflow.executeWorkflow({
            workflowsPath,
            tasksPath,
            codeRoot,
            startToCloseTimeout: timeout / 1000,
            workflowId: prefix(workflowId),
            ...params,
          })
        },

        prefix,
      })
    })
  }
}

testProfiles.only = (description, opts, fn) =>
  testProfiles(description, {...opts, only: true}, fn)

module.exports = testProfiles
