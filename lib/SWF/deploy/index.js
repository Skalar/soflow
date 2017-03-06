import AWS from 'aws-sdk'

import {createReadStream} from 'fs'

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

  const {path: codeZipPath, sha256: codeSha256} = await getCodePackageZip({
    codeRoot,
    workflowsPath,
    tasksPath,
    files,
    ignore,
  })

  // check if decider version sha256 is different
  const deciderVersion =
    existingTemplate.Resources[`deciderLambdaFunctionVersion${codeSha256}`]

  if (!deciderVersion) {
    const codeS3Location = {
      Bucket: `${namespace}-soflow`,
      Key: `lambda-code/${codeSha256}.zip`,
    }

    await s3.putObject({
      ...codeS3Location,
      Body: createReadStream(codeZipPath),
    }).promise()

    // const codeUrl = s3.getSignedUrl('getObject', codeS3Location)

    const newTemplate = generateStackTemplate({
      domain,
      namespace,
      workflows,
      tasks,
      workflowsPath,
      tasksPath,
      version,
      currentTemplate: existingTemplate,
      code: {
        S3Bucket: `${namespace}-soflow`,
        S3Key: `lambda-code/${codeSha256}.zip`,
      },
      codeSha256,
    })

    await updateCFStack({region, stackName, template: newTemplate})

    await s3.deleteObject({...codeS3Location}).promise()
  }
}
