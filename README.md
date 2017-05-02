# SoFlow

An attempt at making AWS SWF usage practical.


## Usage

### Install package


```shell
# Temporary method for now
yarn add https://soflow-package.s3.amazonaws.com/soflow-latest.tgz
```

### Define tasks

__tasks/index.js__

```javascript
export addOrderToDatabase from './addOrderToDatabase'
export sendOrderConfirmation from './sendOrderConfirmation'
```

__tasks/addOrderToDatabase.js__
```javascript
async function addOrderToDatabase(data) {
  // do your stuff
  return result
}

addOrderToDatabase.config = {
  SWF: {
    lambda: {
      memorySize: 128,
      timeout: 60,
    }
  }
}
export default addOrderToDatabase
```

__tasks/sendOrderConfirmation.js__
```javascript
async function sendOrderConfirmation(orderData) {
  // do your stuff
}

export default sendOrderConfirmation
```

### Define workflows

__workflows/index.js__
```javascript
export CreateOrder from './CreateOrder'
```

__workflows/CreateOrder.js__
```javascript
async function CreateOrder({
  input: {
    confirmationEmailRecipient,
    products,
    customerId,
  },
  actions,
  tasks: {
    addOrderToDatabase,
    sendOrderConfirmation,
  }
}) {
  const orderData = await addOrderToDatabase(customerId, products)
  await sendOrderConfirmation(orderData)

  return orderData
}

CreateOrder.config = {
  SWF: {
    tasks: {
      addOrderToDatabase: {type: 'lambda'}, // default
      sendOrderConfirmation: {type: 'activityTask'}
    }
  }
}

export default CreateOrder
```



### Deployment

```javascript
import {SWF} from 'soflow'

const deployPromise = SWF.DevOps.deploy({
  // Prefix for all created resources
  // WARNING: be sure namespace is unique, teardown removes
  // everything it finds within it.
  namespace: 'myapp-production',

  // Name of SWF domain
  // Default: namespace
  domain: 'MyDomain',

  // Description of SWF domain (if one is to be created)
  domainDescription: 'Very nice domain',

  // Version name for the deployment
  version: 'v1',

  // Root of the code to deploy.
  // Default: process.cwd()
  codeRoot: '/my/code/is/here',

  // Whether to continously run decider via scheduled events
  // Default: true
  enableDeciderSchedule: true,

  // Path to your exported workflows, relative to codeRoot
  // Default: 'workflows'
  workflowsPath: 'workflows',

  // Path to your exported tasks, relative to codeRoot
  // Default: 'tasks'
  tasksPath: 'tasks',

  // File patterns of what to include in the lambda package.
  // Everything needed by your tasks must be included (including the soflow npm module).
  // Default: ['**']
  files: [
    'package.json',
    'node_modules/**',
    'workflows/**',
    'tasks/**',
  ],

  // File patterns of what to ignore when building the lambda package
  // Default: ['.git/**']
  ignore: [
    '.git/**',
  ]

  // Name of s3 bucket to use as an intermediary for lambda code packages
  // Default: namespace
  s3Bucket: 'mybucket',

  // Prefix for files in the s3 bucket
  // Default: 'soflow/'
  s3Prefix: 'temporary-files/',

  // Whether or not to create s3 bucket
  // Default: true
  createBucket: false,

  // Location of the soflow module, relative to the codeRoot
  // Default: 'node_modules/soflow'
  soflowRoot: '/shared/node_modules/soflow',

  // How long to keep workflow history.
  // Warning: Cannot be changed after a given workflow version has been created
  // Default: 7
  workflowExecutionRetentionPeriodInDays: 2,

  // AWS region
  // Default: process.env.AWS_DEFAULT_REGION || 'eu-west-1'
  region: 'eu-west-1',
})

```

#### With spinner

```javascript
SWF.DevOps.deployWithSpinner({
  // ...
})
```

#### Manually invoke decider

If you have chosen to set `enableDeciderSchedule` to `false`, you can
invoke a single run of the decider.

```javascript
SWF.DevOps.invokeDecider({
  namespace: 'myapp-production',
  version: 'v1',
})
```

#### Teardown

```javascript
import {SWF} from 'soflow'

const teardownPromise = SWF.DevOps.teardown({
  namespace: 'myapp-production',
  domain: 'MyDomain',
  s3Bucket: 'mybucket',
  s3Prefix: 'temporary-files/',
  removeBucket: false,
  region: 'eu-west-1',
})
```

### Execute workflow
```javascript
import {SWF} from 'soflow'

async function runWorkflow() {
  const result = await SWF.executeWorkflow({
    domain: 'myapp',
    namespace: 'myapp-production',
    id: 'CreateOrder-12345',
    type: 'CreateOrder',
    version: 'v1',
    input: {productIds: [1,2,3]},
  })
}
```

## Development

### Getting started


```shell
# Continuously build files and run unit tests
docker-compose up --build
```

### Running integration tests
```shell
# Copy docker-compose override file and configure AWS credentials
cp docker-compose.override.example.yml docker-compose.override.yml

# Run tests
docker-compose exec dev devops/integration-tests

# Run tests without tearing down CloudFormation stack
docker-compose exec dev devops/integration-tests --no-teardown

# Run tests without setting up and tearing down CloudFormation stack
docker-compose exec dev devops/integration-tests --no-setup --no-teardown
```
