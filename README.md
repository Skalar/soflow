# soflow

Easily run distributed workflows with AWS [Simple Workflow Service](https://aws.amazon.com/swf/) and [Lambda](https://aws.amazon.com/lambda/)

## Table of contents

* [Installation](#installation)
* [Basic usage](#basic-usage)
  * [Defining tasks](#defining-tasks)
  * [Defining workflows](#defining-workflows)
  * [Deploying AWS resources](#deploying-aws-resources)
  * [Running workers](#running-workers)
  * [Executing workflow](#executing-workflow)
  * [Terminating workflow executions](#terminating-workflow-executions)
  * [Tearing down AWS resources](#tearing-down-aws-resources)
  * [Executing workflow without AWS](#executing-workflow-without-aws)
* [Configuration](#configuration)
* [API docs](#api-docs)
* [Development](#development)
  * [Starting dev-environment](#starting-dev-environment)
  * [Running tests](#running-tests)

## Installation

> A minimum of node 6.5.0 is required

```bash
yarn add soflow
```

## Basic usage

> You can find implementation examples over at [Skalar/soflow-examples](https://github.com/Skalar/soflow-examples)

### Defining tasks

> tasks.js

```javascript
async function addOrderToDatabase(data) {
  // do your stuff
  return result
}

addOrderToDatabase.config = {
  concurrency: 100, // ReservedConcurrentExecutions in lambda context
  type: 'both', // deploy as lambda function and register activity type
  memorySize: 128, // only enforced by lambda
  scheduleToStartTimeout: 10, // only applies when run as activity
  startToCloseTimeout: 60,
  scheduleToCloseTimeout: 20, // only applies to activities
}

exports.addOrderToDatabase = addOrderToDatabase
```

### Defining workflows

> workflows.js

```javascript
async function CreateOrder({
  input: {confirmationEmailRecipient, products, customerId},
  tasks: {addOrderToDatabase, sendOrderConfirmation},
}) {
  const orderData = await addOrderToDatabase(customerId, products)
  await sendOrderConfirmation(orderData)

  return orderData
}

CreateOrder.config = {
  startToCloseTimeout: 30,
  tasks: {
    addOrderToDatabase: {type: 'faas'},
    sendOrderConfirmation: {type: 'activity'},
  },
}

exports.CreateOrder = CreateOrder
```

### Deploying AWS resources

```javascript
const {SWF} = require('soflow')

const deployPromise = SWF.Orchestration.setup({
  progressIndicator: true   // default: false

  // File glob patterns to include in the lambda package.
  // Everything needed by your tasks must be included (including the soflow npm module).
  // Default: [`${tasksPath}/**`, `${workflowsPath}/**`]
  files: [
    [
      'stripped_node_modules/**',
      // Provided callback can return a new filename or true/false for whether to include the file
      path => path.replace('stripped_node_modules', 'node_modules')
    ],
    'workflows/**',
    'tasks/**',
    'lib/**',
  ],
})
```

### Running workers

#### Decider worker

> This worker serves as the workflow decider/conductor.

```javascript
#!/usr/bin/env node

const {SWF} = require('soflow')
const workflows = require('./workflows')
const tasks = require('./tasks')

const deciderWorker = new SWF.DeciderWorker({
  workflows,
  tasks,
  concurrency: 2,
})

deciderWorker.on('error', error => {
  console.error(error)
  process.exit(1)
})

deciderWorker.start()
```

#### Activity worker

> This worker executes scheduled activity tasks.

```javascript
#!/usr/bin/env node

const {SWF} = require('soflow')
const workflows = require('./workflows')
const tasks = require('./tasks')

const activityWorker = new SWF.ActivityWorker({
  workflows,
  tasks,
  concurrency: 2,
})

activityWorker.on('error', error => {
  console.error(error)
  process.exit(1)
})

activityWorker.start()
```

#### Lambda decider

> Soflow supports running SWF deciders as Lamda functions.  
> Due to the nature of Lambda and SWF, the implementation has some important details.

##### Enable lambda decider

> When the lambda decider is enabled, soflow enables a scheduled CloudWatch event rule that triggers the decider lambda function every minute.  
> The lambda function will run for 65-130 seconds, exiting when there no longer time (60s + 5s slack) to do an empty poll. This is to prevent decision tasks being temporarily "stuck".
> This means between 1 and 2 deciders are running at any given time, each able to handle multiple decision tasks concurrenctly.
>
> Note that it can take up to 1 minute for the first invocation to happen.

```javascript
await SWF.Orchestration.Lambda.enableDecider()
```

##### Disable lambda decider

> Disables the CloudWatch event rule. It can take up to 2 minutes for all deciders to be shut down.

```javascript
await SWF.Orchestration.Lambda.disableDecider()
```

##### Manually invoke lambda decider function

> May be used with enableDecider() to ensure a decider is running immediately, or to temporarily scale up the decider capacity.

```javascript
await SWF.Orchestration.Lambda.invokeDecider()
```

##### Manually shut down running lambda deciders

```javascript
await SWF.Orchestration.Lambda.shutdownDeciders()
```

### Executing workflow

```javascript
const {SWF} = require('soflow')

async function startCreateOrderWorkflow() {
  // Initiate workflow execution
  const execution = await SWF.executeWorkflow({
    type: 'CreateOrder',
    workflowId: 'CreateOrder-12345',
    input: {productIds: [1, 2, 3]},
  })

  // Optionally await workflow result
  const result = await execution.promise
}
```

### Terminating workflow executions

```javascript
const {SWF} = require('soflow')

async function terminationExample() {
  await SWF.terminateAllExecutions() // terminate ALL workflow executions within namespace
  await SWF.terminateExecution({workflowId: 'myid'})
}
```

### Tearing down AWS resources

> Warning: this removes all AWS resources within the given namespace

```javascript
const {SWF} = require('soflow')

async function teardownExample() {
  await SWF.Orchstration.teardown({
    removeBucket: true, // default: false
    progressIndicator: true, // default: false
  })
}
```

### Executing workflow without AWS

Soflow provides a limited LocalWorkflow backend, with the same API as the SWF backend.  
This can be useful during development or testing, but be aware that it:

* runs all workflow (decider) functions in the current process
* does not enforce worklow timeouts
* only allows workflow signaling within the same process
* runs tasks in separate child processes, on the local node
* only enforces task startToCloseTimeout
* is not able to terminate workflow executions

```javascript
const {LocalWorkflow} = require('soflow')

async function runWorkflowWithoutSWF() {
  const execution = await LocalWorkflow.executeWorkflow({
    type: 'CreateOrder'
    workflowId: 'order-1234'
    input: {}
    // ...
  })

  // Optionally await workflow result
  const result = await execution.promise
}
```

## Configuration

> You can provide configuration as `environment variables`, via `soflow.config` or `passed as an argument` to a soflow function.

```javascript
const {SWF, config} = require('soflow')

config.update({
  namespace: 'mynamespace',
  swfDomain: 'MyDomain'
})

// above code must be required/invoked before your code that uses soflow.

SWF.executeWorkflow({namespace: 'othernamespace', ...})
```

| Variable name        | ENV variable                 | Description                                                                                                                                                       |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `namespace`          | `SOFLOW_NAMESPACE`           | Prefix for all AWS resources (globally unique) <br> _default_: undefined                                                                                          |
| `version`            | `SOFLOW_WORKFLOWS_VERSION`   | Developer-specified workflows version to use <br> _default_: undefined                                                                                            |
| `swfDomain`          | `SOFLOW_SWF_DOMAIN`          | Under which AWS SWF Domain to operate <br> _default_: 'SoFlow'                                                                                                    |
| `codeRoot`           | `SOFLOW_CODE_ROOT`           | Path to root directory of code to be deployed <br> _default_: process.cwd()                                                                                       |
| `tasksPath`          | `SOFLOW_TASKS_PATH`          | Requireable path to tasks, relative to codeRoot <br> _default_: 'tasks'                                                                                           |
| `workflowsPath`      | `SOFLOW_WORKFLOWS_PATH`      | Requireable path to workflows, relative to codeRoot <br> _default_: 'workflows'                                                                                   |
| `soflowPath`         | `SOFLOW_PATH`                | Requireable path to soflow, relative to codeRoot <br> _default_: 'node_modules/soflow'                                                                            |
| `s3Bucket`           | `SOFLOW_S3_BUCKET`           | Name of S3 bucket to for lambda packages <br> _default_: namespace                                                                                                |
| `s3Prefix`           | `SOFLOW_S3_PREFIX`           | Key prefix for S3 objects <br> _default_: 'soflow/'                                                                                                               |
| `awsRegion`          | `SOFLOW_AWS_REGION`          | Which AWS region to operate in <br> _default_: 'eu-west-1'                                                                                                        |
| `executionRetention` | `SOFLOW_EXECUTION_RETENTION` | Number of days to keep workflow executions. <br> **note**: Can only be set the first time an SWF domain is created, after which it is immutable <br> _default_: 1 |

## Development

### Starting dev environment

```bash
# Bring up a local dynamodb and s3 as well as linting every time the code changes.

docker-compose up --build

# Or you could use the tmux-session script:

ln -s $PWD/scripts/tmux-session ~/.bin/soflow

soflow         # start or resume tmux dev session
               # brings up linting, unit and integration tests with file watching

soflow clean   # stops/cleans docker containers, tmux session
```

### Running tests

> Requires the development environment to be running

```bash
# Unit and integration tests for all node targets
docker-compose exec dev scripts/test

# Unit tests for node 6.13.0 with file watching and verbose output
docker-compose exec dev ash -c \
  "NODE_TARGETS=6.13.0 scripts/unit-tests --watch --verbose"

# Integration tests with 'local' profile and untranspiled code using node 9.6.1
docker-compose exec dev ash -c \
  "NODE_TARGETS=9.6.1-native PROFILES=local scripts/unit-tests --verbose"
```
