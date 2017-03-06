import AWS from 'aws-sdk'
import {
  // Errors,
  Utils,
} from '~/lib'

const swf = new AWS.SWF({region: 'eu-west-1'})
const lambda = new AWS.Lambda({region: 'eu-west-1'})

async function DeciderSpawner(event, context, callback) {
  const {
    domain = process.env.SOFLOW_DOMAIN,
    namespace = process.env.SOFLOW_NAMESPACE,
    version = process.env.SOFLOW_WORKFLOWS_VERSION,
    deciderFunction = process.env.SOFLOW_DECIDER_FUNCTION,
    msBetweenPolls = 2000,
    timeoutBuffer = 10000,
    maxDecidersToSpawnPerPoll = 1,
    spawnRatio = 0.1,
  } = event

  const taskListName = `${namespace}_${version}`
  let shuttingDown = false

  console.log('Starting decider spawner...')
  console.log(`Domain: ${domain}`)
  console.log(`Task list: ${taskListName}`)
  console.log(`Decider function: ${deciderFunction}`)
  console.log(`Delay between polls: ${msBetweenPolls}ms`)

  // Schedule shutdown so we complete within lambda execution time limit
  setTimeout(
    () => { shuttingDown = true },
    context.getRemainingTimeInMillis() - (timeoutBuffer + msBetweenPolls)
  )

  let polls = 0

  while (!shuttingDown) {
    polls++

    const lambdaInvocationPromises = []

    if (polls % 10 === 0) {
      console.log(`Poll #${polls}`)
    }

    const {count} = await swf.countPendingDecisionTasks({
      domain,
      taskList: {name: taskListName},
    }).promise()

    const numberOfDecidersToSpawn = Math.min(
      maxDecidersToSpawnPerPoll,
      Math.ceil(count * spawnRatio, 1)
    )

    if (numberOfDecidersToSpawn > 0) {
      console.info(`${count} pending tasks, spawning ${numberOfDecidersToSpawn} deciders`)
    }

    for (let spawned = 0; spawned < numberOfDecidersToSpawn; spawned++) {
      lambdaInvocationPromises.push(
        lambda.invoke({
          ClientContext: 'MyApp',
          FunctionName: `${deciderFunction}`,
          InvocationType: 'Event',
          Payload: JSON.stringify({}),
        }).promise()
      )
    }

    try {
      await Promise.all(lambdaInvocationPromises)
    }
    catch (error) {
      return callback(error)
    }

    await Utils.sleep(msBetweenPolls)
  }

  callback()
}

export default DeciderSpawner
