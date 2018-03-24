const path = require('path')
const config = require('../../config')
const serializeError = require('serialize-error')
const {spawn} = require('child_process')
const os = require('os')
const {writeFileSync, readFileSync, unlinkSync} = require('fs')

async function runTaskInChildProcess(context, {name, args, timeout}) {
  const resultFilePath = path.join(
    os.tmpdir(),
    Math.random()
      .toString(36)
      .substring(2, 15)
  )

  await new Promise((resolve, reject) => {
    const taskProcess = spawn(
      config.nodeCommand,
      [
        __filename,
        `${context.config.codeRoot}/${context.config.tasksPath}`,
        name,
        JSON.stringify(args),
        resultFilePath,
      ],
      {timeout, stdio: 'inherit'}
    )
    taskProcess.on(
      'close',
      code => (code === 0 ? resolve() : reject('error executing task'))
    )
  })

  const {error: deserializedError, result} = JSON.parse(
    readFileSync(resultFilePath)
  )

  unlinkSync(resultFilePath)

  if (deserializedError) {
    const error = new Error(deserializedError.message)
    Object.assign(error, deserializedError)

    throw error
  }

  return result
}

module.exports = runTaskInChildProcess

// Run task in child process

if (require.main === module) {
  const [, , modulePath, exportName, argsJSON, resultFilePath] = process.argv
  const args = JSON.parse(argsJSON)

  const module = require(modulePath)
  const func = module[exportName]

  try {
    const taskReturnValue = func(...args)
    if (typeof taskReturnValue.then === 'function') {
      taskReturnValue
        .then(result => writeFileSync(resultFilePath, JSON.stringify({result})))
        .catch(error => {
          writeFileSync(
            resultFilePath,
            JSON.stringify({error: serializeError(error)})
          )
        })
    } else {
      writeFileSync(resultFilePath, JSON.stringify({result: taskReturnValue}))
    }
  } catch (error) {
    writeFileSync(
      resultFilePath,
      JSON.stringify({error: serializeError(error)})
    )
  }
}
