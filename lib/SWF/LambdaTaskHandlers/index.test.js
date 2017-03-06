// import test from 'blue-tape'
//
// import LambdaTaskHandler from '~/lib/SWF/LambdaTaskHandler'
//
// function runTaskHandler(taskHandler, input) {
//   return new Promise((resolve, reject) => {
//     taskHandler(
//       input,
//       {},
//       (err, result) => err ? reject(err) : resolve(result)
//     )
//   })
// }
//
// test('SWF.LambdaTaskHandler', {timeout: 1000}, async t => {
//
//   t.equal(
//     await runTaskHandler(
//       LambdaTaskHandler(
//         number => number * 2
//       ),
//       2
//     ),
//     4,
//     'handles successful invocations correctly'
//   )
//
//   t.shouldFail(
//     runTaskHandler(
//       LambdaTaskHandler(
//         number => {
//           throw new Error('Some error')
//         }
//       ),
//       2
//     ),
//     'handles errors',
//   )
//
// })
