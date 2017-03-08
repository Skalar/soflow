import AWS from 'aws-sdk'
import path from 'path'

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
    // workflowExecutionRetentionPeriodInDays = 7,
    // domainDescription = 'SoFlow workflows',
    region = 'eu-west-1',
    soflowRoot = path.relative(
      codeRoot,
      path.resolve(path.dirname(__filename), '../../..')
    ),
  } = args

  if (!version.match(/^(?!^[0-9]+$)([a-zA-Z0-9-_]+)$/)) {
    throw new Error('Invalid version')
  }

  const s3 = new AWS.S3({region})
  const cf = new AWS.CloudFormation({region})

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
    const template = generateStackTemplate({namespace})
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
    namespace,
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
    currentTemplate: JSON.parse(TemplateBody),
    code: {
      S3Bucket: `${namespace}-soflow`,
      S3Key: `lambda-code/${hexHash}.zip`,
    },
    codeSha256: base64Hash,
  })

  try {
    if (JSON.stringify(existingTemplate) !== JSON.stringify(newTemplate)) {
      await updateCFStack({region, stackName, template: newTemplate})
    }
  } catch (error) {
    await s3.deleteObject({...s3Location}).promise()

    throw error
  }

  await s3.deleteObject({...s3Location}).promise()
}
