// import test from 'blue-tape'
// import proxyquire from 'proxyquire'
// import {DeciderContext} from '~/lib/SWF'
//
// let swf = {},
//     lambda = {},
//     AWS
//
// AWS = {
//   SWF() {
//     return swf
//   },
//   Lambda() {
//     return lambda
//   }
// }
//
// const DeciderSpawner = proxyquire('./index', {'aws-sdk': AWS, '@noCallThru': true}).default
//
// test('SWF.DeciderSpawner', {timeout: 1000}, async t => {
//   t.plan(1)
//
//   const domain = 'test'
//   const workflowNames = ['workflowA', 'workflowB']
//   const context = {
//     getRemainingTimeInMillis() {
//       return 1
//     }
//   }
//
//   swf.listWorkflowTypes = options => {
//     const {name} = options
//
//     return {
//       promise: () => Promise.resolve({
//         typeInfos: [
//           {workflowType: {name, version: '1'}},
//           {workflowType: {name, version: '2'}},
//         ]
//       })
//     }
//   }
//
//   const decisionTasks = {
//     workflowA_1: 1,
//     workflowA_2: 1,
//     workflowB_1: 1,
//     workflowB_2: 1,
//   }
//
//   const deciderInvocations = []
//
//   swf.countPendingDecisionTasks = ({domain, taskList}) => {
//     return {
//       promise: () => Promise.resolve({
//         count: Math.max(0, decisionTasks[taskList]--) + 1
//       })
//     }
//   }
//
//   lambda.invoke = ({FunctionName, Payload}) => {
//     deciderInvocations.push({FunctionName, Payload})
//
//     return {
//       promise() {
//         return Promise.resolve({})
//       }
//     }
//   }
//
//   await new Promise((resolve, reject) => {
//     DeciderSpawner(
//       {
//         domain,
//         workflowNames, msBetweenPolls: 0,
//         remainingTimeBuffer: 0,
//       },
//       context,
//       (err, result) => {
//         err ? reject(err) : resolve(result)
//       }
//     )
//   })
//
//   t.deepEqual(
//     deciderInvocations,
//     [
//       {
//         FunctionName: 'swfDecider_1',
//         Payload: {workflowName: 'workflowA', workflowVersion: '1'}
//       },
//       {
//         FunctionName: 'swfDecider_2',
//         Payload: {workflowName: 'workflowA', workflowVersion: '2'}
//       },
//       {
//         FunctionName: 'swfDecider_1',
//         Payload: {workflowName: 'workflowB', workflowVersion: '1'}
//       },
//       {
//         FunctionName: 'swfDecider_2',
//         Payload: {workflowName: 'workflowB', workflowVersion: '2'}
//       }
//     ],
//     'Invokes the appropriate deciders'
//   )
//
//   })
