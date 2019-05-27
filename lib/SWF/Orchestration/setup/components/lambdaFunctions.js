const get = require('lodash.get')
const path = require('path')
const config = require('../../../../config')
const awsName = require('../../../awsName')

const {createRoleWithInlinePolicy} = require('../../setup/helpers')

const {
  createOrUpdateFunction,
  createOrUpdateVersionAlias,
} = require('../../Lambda')

module.exports = function({
  namespace,
  soflowPath,
  tasksPath,
  version,
  tasks,
  workflows,
}) {
  const cloudWatchLogs = new config.AWS.CloudWatchLogs()
  const lambda = new config.AWS.Lambda()

  const setupTasks = {}
  for (const taskName of Object.keys(tasks)) {
    const task = tasks[taskName]
    const isUsedAsLambdaFunctionInWorkflow = Object.values(workflows).some(
      workflow => {
        const taskType = get(workflow.config, ['tasks', taskName, 'type'])
        const defaultType = get(workflow.config, 'tasks.default.type')
        return (
          taskType === 'faas' ||
          taskType === 'both' ||
          (defaultType === 'faas' && !taskType)
        )
      }
    )

    const isConfiguredAsFunction = ['faas', 'both'].includes(
      get(tasks[taskName], 'config.type')
    )

    if (!isConfiguredAsFunction && !isUsedAsLambdaFunctionInWorkflow) {
      continue
    }

    const {
      timeout = 60,
      description,
      rolePolicyStatements,
      memorySize,
      environment,
      permissions,
      concurrency,
      runtime = 'nodejs8.10',
    } = get(task, 'config', {})

    const functionName = awsName.lambda(`${namespace}_${taskName}`)

    if (rolePolicyStatements) {
      const roleName = awsName.role(`${namespace}_${taskName}_${version}`)

      setupTasks[`task.${taskName}.role`] = function() {
        return createRoleWithInlinePolicy({
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: ['lambda.amazonaws.com'],
                },
                Action: ['sts:AssumeRole'],
              },
            ],
          },
          RoleName: roleName,
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: 'arn:aws:logs:*:*:*',
              },
              ...rolePolicyStatements,
            ],
          },
        })
      }
    }

    if (permissions) {
      setupTasks[`task.${taskName}.lambdaFunctionPermissions`] = [
        `task.${taskName}.lambdaFunction`,
        async ({[`task.${taskName}.lambdaFunction`]: lambdaFunction}) => {
          const accountId = lambdaFunction.FunctionArn.split(':')[4]

          for (const {StatementId, Action, Principal} of permissions) {
            try {
              await lambda
                .addPermission({
                  FunctionName: lambdaFunction.FunctionArn,
                  StatementId,
                  Action,
                  Principal,
                  SourceAccount: accountId,
                })
                .promise()
            } catch (error) {
              if (error.code !== 'ResourceConflictException') throw error
            }
          }
        },
      ]
    }

    if (typeof concurrency !== 'undefined') {
      setupTasks[`task.${taskName}.lambdaFunctionPutConcurrency`] = [
        `task.${taskName}.lambdaFunction`,
        async ({[`task.${taskName}.lambdaFunction`]: lambdaFunction}) => {
          return await lambda
            .putFunctionConcurrency({
              FunctionName: lambdaFunction.FunctionArn,
              ReservedConcurrentExecutions: concurrency,
            })
            .promise()
        },
      ]
    }

    setupTasks[`task.${taskName}.lambdaFunction`] = [
      'uploadCode',
      rolePolicyStatements ? `task.${taskName}.role` : 'defaultLambdaRole',
      async function({
        uploadCode,
        defaultLambdaRole,
        [`task.${taskName}.role`]: customRole,
      }) {
        return createOrUpdateFunction({
          code: {
            S3Bucket: uploadCode.Bucket,
            S3Key: uploadCode.Key,
          },
          functionName,
          description,
          handler: path.join(
            soflowPath,
            `lib-8_10_0/SWF/Orchestration/Lambda/wrappedTasks.${taskName}`
          ),
          runtime,
          memorySize,
          timeout,
          environment: {SOFLOW_TASKS_PATH: tasksPath, ...environment},
          role: rolePolicyStatements
            ? customRole.Role.Arn
            : defaultLambdaRole.Role.Arn,
        })
      },
    ]

    setupTasks[`task.${taskName}.lambdaVersionAlias`] = [
      `task.${taskName}.lambdaFunction`,
      ({[`task.${taskName}.lambdaFunction`]: lambdaFunction}) => {
        return createOrUpdateVersionAlias({
          functionName,
          functionVersion: lambdaFunction.Version,
          name: version,
        })
      },
    ]

    setupTasks[`task.${taskName}.logGroup`] = async () => {
      try {
        return await cloudWatchLogs
          .createLogGroup({
            logGroupName: `/aws/lambda/${namespace}_${taskName}`,
          })
          .promise()
      } catch (error) {
        if (error.code !== 'ResourceAlreadyExistsException') throw error
      }
    }
  }

  return setupTasks
}
