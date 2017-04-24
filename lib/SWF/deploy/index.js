import AWS from 'aws-sdk'

import generateStackTemplate from './generateStackTemplate'
import createCFStack from './createCFStack'
import updateCFStack from './updateCFStack'
import getCodePackageZip from './getCodePackageZip'

export default async function deploy(args) {
  const {
    namespace,
    domain = namespace,
    stackName = namespace,
    version = 'v1',
    codeRoot = process.cwd(),
    workflowsPath = 'workflows',
    tasksPath = 'tasks',
    files = ['**'],
    ignore = ['.git/**'],
    s3Bucket = `${namespace}-soflow`,
    createBucket = true,
    s3Prefix = 'soflow/',
    // workflowExecutionRetentionPeriodInDays = 7,
    // domainDescription = 'SoFlow workflows',
    region = 'eu-west-1',
    soflowRoot = 'node_modules/@skalar/soflow',
    runDeciderImmediately = false,
  } = args

  if (!version.match(/^(?!^[0-9]+$)([a-zA-Z0-9-_]+)$/)) {
    throw new Error('Invalid version')
  }

  const s3 = new AWS.S3({region})
  const cf = new AWS.CloudFormation({region})
  const lambda = new AWS.Lambda({region})

  const workflows = require(`${codeRoot}/${workflowsPath}`)
  const tasks = require(`${codeRoot}/${tasksPath}`)

  let stack

  try {
    const {Stacks: [astack]} = await cf.describeStacks({
      StackName: stackName,
    }).promise()

    stack = astack
  } catch (error) {
    if (error.code !== 'ValidationError') {
      throw error
    }
  }

  if (!stack) {
    const template = generateStackTemplate({
      namespace,
      createBucket,
      s3Bucket,
    })
    await createCFStack({region, stackName, template})
  }

  const {TemplateBody} = await cf.getTemplate({
    StackName: stackName,
  }).promise()

  const existingTemplate = JSON.parse(TemplateBody)

  const {s3Location, hexHash, base64Hash} = await getCodePackageZip({
    codeRoot,
    workflowsPath,
    tasksPath,
    files,
    ignore,
    s3Bucket,
    s3Prefix,
    region,
  })

  const newTemplate = generateStackTemplate({
    domain,
    namespace,
    workflows,
    tasks,
    workflowsPath,
    tasksPath,
    version,
    soflowRoot,
    createBucket,
    s3Bucket,
    s3Prefix,
    currentTemplate: JSON.parse(TemplateBody),
    code: {
      S3Bucket: s3Bucket,
      S3Key: `${s3Prefix}${hexHash}.zip`,
    },
    codeSha256: base64Hash,
  })

  try {
    if (JSON.stringify(existingTemplate) !== JSON.stringify(newTemplate)) {
      await updateCFStack({region, stackName, template: newTemplate, s3Bucket, s3Prefix})
    }
    if (runDeciderImmediately) {
      await lambda.invoke({
        FunctionName: `${namespace}_decider`,
        InvocationType: 'Event',
      }).promise()
    }
  } catch (error) {
    await s3.deleteObject({...s3Location}).promise()

    throw error
  }

  await s3.deleteObject({...s3Location}).promise()
}
