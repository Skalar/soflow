const config = require('../../../../config')
const path = require('path')

const {createRoleWithInlinePolicy} = require('../../setup/helpers')

const {
  createOrUpdateFunction,
  createOrUpdateVersionAlias,
} = require('../../Lambda')

const awsName = require('../../../awsName')

module.exports = function({
  namespace,
  soflowPath,
  workflowsPath,
  tasksPath,
  version,
  domain,
}) {
  const cwe = new config.AWS.CloudWatchEvents()
  const lambda = new config.AWS.Lambda()
  const cloudWatchLogs = new config.AWS.CloudWatchLogs()
  const functionName = awsName.lambda(`${namespace}_decider`)

  return {
    'decider.role': async () => {
      const role = await createRoleWithInlinePolicy({
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
        RoleName: awsName.role(`${namespace}_deciderRole`),
        PolicyName: 'default',
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
            {
              Effect: 'Allow',
              Action: ['swf:*', 'iam:PassRole'],
              Resource: '*',
            },
          ],
        },
      })
      return role
    },

    'decider.lambdaFunction': [
      'uploadCode',
      'decider.role',
      ({uploadCode, 'decider.role': {Role: {Arn: role}}}) => {
        return createOrUpdateFunction({
          code: {
            S3Bucket: uploadCode.Bucket,
            S3Key: uploadCode.Key,
          },
          functionName,
          description: 'soflow decider',
          handler: path.join(
            soflowPath,
            'lib-6_13_0/SWF/Orchestration/Lambda/deciderHandler.handler'
          ),
          runtime: 'nodejs6.10',
          memorySize: 128,
          timeout: (60 + config.lambdaDeciderPolltimeSlackInSeconds) * 2, // 60 seconds per poll + some slack
          environment: {
            SOFLOW_WORKFLOWS_PATH: workflowsPath,
            SOFLOW_TASKS_PATH: tasksPath,
            SOFLOW_WORKFLOWS_VERSION: version,
            SOFLOW_NAMESPACE: namespace,
            SOFLOW_SWF_DOMAIN: domain,
            LOG_LEVEL: 'debug',
          },
          role,
        })
      },
    ],

    'decider.logGroup': async () => {
      try {
        return await cloudWatchLogs
          .createLogGroup({
            logGroupName: `/aws/lambda/${namespace}_decider`,
          })
          .promise()
      } catch (error) {
        if (error.code !== 'ResourceAlreadyExistsException') throw error
      }
    },

    'decider.lambdaFunctionVersionAlias': [
      'decider.lambdaFunction',
      ({'decider.lambdaFunction': deciderFunction}) => {
        return createOrUpdateVersionAlias({
          functionName,
          functionVersion: deciderFunction.Version,
          name: version,
        })
      },
    ],

    'decider.cloudWatchEventsRule': () => {
      return cwe
        .putRule({
          Name: awsName.rule(
            `${namespace}_deciderCloudWatchEventRule_${version}`
          ),
          Description: 'soflow: Start decider every 1 minute',
          ScheduleExpression: 'rate(1 minute)',
          State: 'DISABLED',
        })
        .promise()
    },

    'decider.cloudWatchEventsRuleTarget': [
      'decider.lambdaFunction',
      'decider.lambdaFunctionVersionAlias',
      'decider.eventsRuleLambdaPermission',
      ({'decider.lambdaFunction': deciderFunction}) => {
        return cwe
          .putTargets({
            Rule: awsName.rule(
              `${namespace}_deciderCloudWatchEventRule_${version}`
            ),
            Targets: [
              {
                Id: 'Decider',
                Arn: `${deciderFunction.FunctionArn}:${version}`,
                Input: JSON.stringify({}),
              },
            ],
          })
          .promise()
      },
    ],

    'decider.eventsRuleLambdaPermission': [
      'decider.lambdaFunctionVersionAlias',
      'decider.cloudWatchEventsRule',
      async ({
        'decider.lambdaFunction': deciderFunction,
        'decider.cloudWatchEventsRule': rule,
      }) => {
        try {
          return await lambda
            .addPermission({
              StatementId: 'invokeDecider',
              FunctionName: deciderFunction.FunctionArn,
              Action: 'lambda:InvokeFunction',
              Principal: 'events.amazonaws.com',
              Qualifier: version,
              SourceArn: rule.RuleArn,
            })
            .promise()
        } catch (error) {
          if (error.code !== 'ResourceConflictException') throw error
        }
      },
    ],
  }
}
