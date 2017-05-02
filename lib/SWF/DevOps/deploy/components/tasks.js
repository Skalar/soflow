import {get} from 'lodash'
import path from 'path'
import AWS from 'aws-sdk'
import awsName from '~/lib/SWF/awsName'

import {
  createRoleWithInlinePolicy,
  createOrUpdateLambdaFunction,
  createOrUpdateLambdaVersionAlias,
} from '~/lib/SWF/DevOps/deploy/helpers'

const cloudWatchLogs = new AWS.CloudWatchLogs({region: process.env.AWS_DEFAULT_REGION})

export default function({
  namespace,
  soflowRoot,
  tasksPath,
  version,
  tasks,
}) {
  const deployTasks = {}
  for (const taskName of Object.keys(tasks)) {
    const task = tasks[taskName]

    const {
      timeout = 60,
      description = 'SoFlow task',
      rolePolicyStatement,
      memorySize,
      environment,
      runtime = 'nodejs6.10',
    } = get(task, 'config.SWF.lambda', {})

    const functionName = awsName.lambda(`${namespace}_${taskName}`)

    if (rolePolicyStatement) {
      const roleName = awsName.role(`${namespace}_${taskName}_${version}`)

      deployTasks[`task.${taskName}.role`] = function() {
        return createRoleWithInlinePolicy({
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com']
              },
              Action: ['sts:AssumeRole']
            }]
          },
          RoleName: roleName,
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: 'arn:aws:logs:*:*:*'
              },
              ...rolePolicyStatement
            ],
          }
        })
      }
    }

    deployTasks[`task.${taskName}.lambdaFunction`] = [
      'uploadCode',
      rolePolicyStatement ? `task.${taskName}.role` : 'defaultLambdaRole',
      async function({uploadCode, defaultLambdaRole, [`task.${taskName}.role`]: customRole}) {
        return createOrUpdateLambdaFunction({
          code: {
            S3Bucket: uploadCode.Bucket,
            S3Key: uploadCode.Key,
          },
          functionName,
          description,
          handler: path.join(soflowRoot, `lib/SWF/LambdaTaskHandlers.${taskName}`),
          runtime,
          memorySize,
          timeout,
          environment: {TASKS_PATH: tasksPath, ...environment},
          role: rolePolicyStatement ? customRole.Role.Arn : defaultLambdaRole.Role.Arn
        })
      }
    ]

    deployTasks[`task.${taskName}.lambdaVersionAlias`] = [
      `task.${taskName}.lambdaFunction`,
      ({[`task.${taskName}.lambdaFunction`]: lambdaFunction}) => {
        return createOrUpdateLambdaVersionAlias({
          functionName,
          functionVersion: lambdaFunction.Version,
          name: version,
        })
      }
    ]

    deployTasks[`task.${taskName}.logGroup`] = async () => {
      try {
        return await cloudWatchLogs.createLogGroup({
          logGroupName: `/aws/lambda/${namespace}_${taskName}`
        }).promise()
      }
      catch (error) {
        if (error.code !== 'ResourceAlreadyExistsException') throw error
      }
    }
  }

  return deployTasks
}
