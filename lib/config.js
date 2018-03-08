const AWS = require('aws-sdk')
const path = require('path')

module.exports = {
  update(props) {
    for (const [key, val] of Object.entries(props)) {
      delete this[key]
      this[key] = val
    }
  },

  awsRegion: process.env.SOFLOW_AWS_REGION || 'eu-west-1',

  get namespace() {
    if (!process.env.SOFLOW_NAMESPACE) {
      throw new Error('"namespace" must be defined')
    }
    return process.env.SOFLOW_NAMESPACE
  },

  get workflowsVersion() {
    if (!process.env.SOFLOW_WORKFLOWS_VERSION) {
      throw new Error('"workflowsVersion" must be defined')
    }
    return process.env.SOFLOW_WORKFLOWS_VERSION
  },

  get soflowPath() {
    return path.join(this.modulesPath, 'soflow')
  },

  swfDomain: 'SoFlow',
  swfDomainDescription: 'soflow',
  codeRoot: process.cwd(),
  modulesPath: 'node_modules',
  tasksPath: process.env.SOFLOW_TASKS_PATH || 'tasks',
  workflowsPath: 'workflows',
  workflowPrefix: process.env.SOFLOW_WORKFLOW_PREFIX,
  // lambdaDeciderFunctionTargetConcurrency: 2,
  lambdaDeciderPolltimeSlackInSeconds: 10,

  get s3Bucket() {
    return this.namespace
  },

  s3Prefix: 'soflow/',

  executionRetention: 1,

  get AWS() {
    AWS.config.update({region: this.awsRegion})

    return AWS
  },
}
