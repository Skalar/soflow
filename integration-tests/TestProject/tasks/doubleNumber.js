export default function doubleNumber(number) {
  return number * 2
}

// doubleNumber.timeout = 40
// doubleNumber.description = 'MyDescription'
//
// doubleNumber.env = {
//   COMPANY_NAME: 'MyCorp'
// }
//
// doubleNumber.lambda = {
//   memorySize: 128,
//   role: 'wee',
//   iamStatements: [
//     {
//       Effect: 'Allow',
//       Action: '*',
//       Resource: 's3:*',
//     }
//   ]
// }
//
// doubleNumber.activity = {
//   defaultTaskList: 'default',
//   defaultTaskPriority: 0,
//   defaultTaskHeartbeatTimeout: 20,
//   defaultTaskScheduleToStartTimeout: 5,
//   defaultTaskStartToCloseTimeout: 5,
//   defaultTaskScheduleToCloseTimeout: 10,
// }
