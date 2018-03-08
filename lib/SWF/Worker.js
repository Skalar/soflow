const config = require('../config')
const {EventEmitter} = require('events')

class Worker extends EventEmitter {
  constructor({
    concurrency = 1,
    tasks,
    workflows,
    domain: swfDomain = config.swfDomain,
    namespace = config.namespace,
    version = config.workflowsVersion,
    taskList = `${namespace}_${version}`,
    identity = 'soflow-worker',
    shouldContinuePolling = () => true,
    logger = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].reduce(
      (l, level) => ({
        ...l,
        [level](...args) {
          if (args.length === 2) {
            const [data, message] = args
            console.log(`DeciderWorker[#${data.slot}] ${message}`)
          } else {
            console.log(`DeciderWorker ${args[0]}`)
          }
        },
      }),
      {}
    ),
    swf: providedSwf,
  }) {
    super()

    Object.assign(this, {
      swf: providedSwf || new config.AWS.SWF(),
      swfDomain,
      namespace,
      tasks,
      workflows,
      concurrency,
      version,
      identity,
      taskList,
      logger,
      shouldContinuePolling,
      activeCount: 0,
      pollRequests: new Set(),
      stopRequested: false,
    })

    process.on('SIGTERM', () => this.stop())
  }

  start() {
    this.logger.debug(
      `start (concurrency: ${this.concurrency}, taskList: ${this.taskList})`
    )

    this.stopRequested = false
    for (let i = 0; i < this.concurrency; i++) {
      this.pollLoop(i)
    }

    this.emit('started', {concurrency: this.concurrency})
  }

  stop({abort = false} = {}) {
    this.logger.debug(`Stopping (abort: ${abort})`)

    this.stopRequested = true

    if (abort) {
      for (const request of this.pollRequests) {
        request.abort()
      }
    }

    setImmediate(() => this.emit('stop'))
  }

  async pollLoop(slot) {
    while (!this.stopRequested && this.shouldContinuePolling()) {
      try {
        this.logger.debug({slot}, 'polling for task')
        const pollStartedAt = new Date()
        const task = await this.pollForTask()

        if (task && task.taskToken) {
          const taskReceivedAt = new Date()
          this.logger.debug(
            {slot},
            `received task (after ${taskReceivedAt - pollStartedAt} ms)`
          )
          this.emit('task', task)
          await this.handleTask(task)
          const taskHandledAt = new Date()
          this.logger.debug(
            {slot},
            `task handled (${taskHandledAt - taskReceivedAt} ms)`
          )
        } else {
          this.logger.debug(
            {slot},
            `poll did not yield a task (after ${new Date() - pollStartedAt} ms)`
          )
          this.emit('noTask')
        }
      } catch (error) {
        if (error.code !== 'RequestAbortedError') {
          this.logger.debug({slot}, `error while polling: ${error.message}`)
          this.emit('error', error)
        }
      }
    }
    this.logger.debug('gracefully stopped')
    this.emit('stopped')
  }

  pollForTask() {
    throw new Error('pollForTask() not implemented')
    // should return request with promise
  }

  handleTask() {
    throw new Error('handleTask() not implemented')
  }
}

module.exports = Worker
