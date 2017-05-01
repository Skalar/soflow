import AWS from 'aws-sdk'
import path from 'path'

import {
  createRoleWithInlinePolicy,
  createOrUpdateLambdaFunction,
  createOrUpdateLambdaVersionAlias,
} from '~/lib/SWF/DevOps/deploy/helpers'


const cwe = new AWS.CloudWatchEvents({region: process.env.AWS_DEFAULT_REGION})
const lambda = new AWS.Lambda({region: process.env.AWS_DEFAULT_REGION})
const cloudWatchLogs = new AWS.CloudWatchLogs({region: process.env.AWS_DEFAULT_REGION})

export default function({
  namespace,
  soflowRoot,
  workflowsPath,
  tasksPath,
  version,
  domain,
  enableDeciderSchedule,
}) {
  const functionName = `${namespace}_decider`

  return {
    'decider.role': async () => {
      const role = await createRoleWithInlinePolicy({
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
        RoleName: `${namespace}_deciderRole`,
        PolicyName: 'default',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: 'arn:aws:logs:*:*:*'
            },
            {
              Effect: 'Allow',
              Action: ['swf:*', 'iam:PassRole'],
              Resource: '*',
            },
          ],
        }
      })
      return role
    },

    'decider.lambdaFunction': [
      'uploadCode',
      'decider.role',
      ({uploadCode, 'decider.role': {Role: {Arn: role}}}) => {
        return createOrUpdateLambdaFunction({
          code: {
            S3Bucket: uploadCode.Bucket,
            S3Key: uploadCode.Key,
          },
          functionName,
          description: 'SoFlow decider',
          handler: path.join(soflowRoot, 'lib/SWF/Decider.default'),
          runtime: 'nodejs6.10',
          memorySize: 128,
          timeout: 60 * 2, // Allow for one minute more than we actually plan on using (for overlap). rule should be set to two minutes
          environment: {
            WORKFLOWS_PATH: workflowsPath,
            TASKS_PATH: tasksPath,
            SOFLOW_WORKFLOWS_VERSION: version,
            SOFLOW_NAMESPACE: namespace,
            SOFLOW_DOMAIN: domain,
            DEBUG: 'soflow',
            LOG_LEVEL: 'debug',
          },
          role,
        })
      }
    ],

    'decider.logGroup': async () => {
      try {
        return await cloudWatchLogs.createLogGroup({
          logGroupName: `/aws/lambda/${namespace}_decider`
        }).promise()
      }
      catch (error) {
        if (error.code !== 'ResourceAlreadyExistsException') throw error
      }
    },

    'decider.lambdaFunctionVersionAlias': [
      'decider.lambdaFunction',
      ({'decider.lambdaFunction': deciderFunction}) => {
        return createOrUpdateLambdaVersionAlias({
          functionName,
          functionVersion: deciderFunction.Version,
          name: version,
        })
      }
    ],

    'decider.cloudWatchEventsRule': () => {
      return cwe.putRule({
        Name: `${namespace}_${version}_deciderCloudWatchEventRule`,
        Description: 'Start decider every 1 minute',
        ScheduleExpression: 'rate(1 minute)',
        State: enableDeciderSchedule ? 'ENABLED' : 'DISABLED',
      }).promise()
    },

    'decider.cloudWatchEventsRuleTarget': [
      'decider.lambdaFunction',
      ({'decider.lambdaFunction': deciderFunction}) => {
        return cwe.putTargets({
          Rule: `${namespace}_${version}_deciderCloudWatchEventRule`,
          Targets: [{
            Id: 'Decider',
            Arn: `${deciderFunction.FunctionArn}:${version}`,
            Input: JSON.stringify({})
          }]
        }).promise()
      }
    ],

    'decider.eventsRuleLambdaPermission': [
      'decider.lambdaFunction',
      'decider.cloudWatchEventsRule',
      async ({
        'decider.lambdaFunction': deciderFunction,
        'decider.cloudWatchEventsRule': rule
      }) => {
        try {
          return await lambda.addPermission({
            StatementId: 'invokeDecider',
            FunctionName: deciderFunction.FunctionArn,
            Action: 'lambda:InvokeFunction',
            Principal: 'events.amazonaws.com',
            SourceArn: rule.RuleArn,
          }).promise()
        }
        catch (error) {
          if (error.code !== 'ResourceConflictException') throw error
        }
      }
    ]
  }
}
