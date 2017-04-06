export runTask from './runTask'
export timer from './timer'
export cancelTimer from './cancelTimer'
export childWorkflow from './childWorkflow'
// export function timer(delayInSeconds, id = new Date()) {
//   return new Promise(
//     resolve => {
//       this.timers[id] = setTimeout(resolve, delayInSeconds * 1000)
//     }
//   )
// }
//
// export function cancelTimer(timerId) {
//   clearTimeout(this.timers[timerId])
//   delete this.timers[timerId]
// }
//
// export function cancelTask() {
//   throw new NotImplementedError()
//   // TODO memorize so that we can answer with cancellation on heartbeat
// }
//
// export function cancel(reason) {
//   throw new WorkflowCancelled(reason)
// }
//
// export function mark(name, details = {}) {
//   console.info(`[MARK] ${name}`, details)
// }
//
// export function childWorkflow(workflowName, input) {
//   return this.executeWorkflow(workflowName, input)
// }
//
// export function signalExternalWorkflow() {
//   throw new NotImplementedError()
// }
//
// export function cancelExternalWorkflow() {
//   throw new NotImplementedError()
// }
//
// export function continueAsNewWorkflow() {
//   throw new NotImplementedError()
// }
//
// export async function runTask(taskName, input, config) {
//   console.log('config', config)
//   const task = this.tasks[taskName]
//
//   if (!task) {
//     throw new UnknownTaskTypeError(taskName)
//   }
//
//   const result = task.apply(this, input)
//
//   return result
// }
//
// export async function retry({attempts, delay}, func) {
//   let attempt = 0
//
//   while (true) {
//     attempt++
//
//     try {
//       this.blocks.push({attempt})
//       const promise = func(attempt)
//       this.blocks.pop()
//
//       return await promise
//     }
//     catch (error) {
//       // Do exclusion/inclusion here?
//       if (attempt >= attempts) {
//         throw error
//       }
//     }
//   }
// }
