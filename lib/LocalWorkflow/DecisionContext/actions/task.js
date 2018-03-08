const get = require('lodash.get')

const runTaskInChildProcess = require('../runTaskInChildProcess')

async function task(
  context,
  {
    name,
    args = [],
    startToCloseTimeout = get(context.taskConfigs, [
      name,
      'startToCloseTimeout',
    ]),
  }
) {
  const result = await runTaskInChildProcess(context, {
    name,
    args,
    timeout: startToCloseTimeout,
  })

  return result
}

module.exports = task
