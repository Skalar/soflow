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
    return process.env.SOFLOW_PATH || path.join(this.modulesPath, 'soflow')
  },

  swfDomain: process.env.SOFLOW_SWF_DOMAIN || 'SoFlow',
  swfDomainDescription: 'soflow',
  codeRoot: process.env.SOFLOW_CODE_ROOT || process.cwd(),
  modulesPath: 'node_modules',
  tasksPath: process.env.SOFLOW_TASKS_PATH || 'tasks',
  workflowsPath: process.env.SOFLOW_WORKFLOWS_PATH || 'workflows',
  workflowPrefix: process.env.SOFLOW_WORKFLOW_PREFIX,
  // lambdaDeciderFunctionTargetConcurrency: 2,
  lambdaDeciderPolltimeSlackInSeconds: 10,

  get s3Bucket() {
    return process.env.SOFLOW_S3_BUCKET || this.namespace
  },

  s3Prefix: process.env.SOFLOW_S3_PREFIX || 'soflow/',

  executionRetention: process.env.SOFLOW_EXECUTION_RETENTION || 1,

  get AWS() {
    AWS.config.update({region: this.awsRegion})

    return AWS
  },
}
