import path from 'path'
import lambdaFunctionWithAliasedVersion from './lambdaFunctionWithAliasedVersion'
import sanitizeLogicalId from './sanitizeLogicalId'
const MAXIMUM_LAMBDA_EXECUTION_TIME = 300

function generateStackTemplate({
  namespace,
  currentTemplate = {},
  tasks,
  code,
  codeSha256,
  version,
  workflows,
  domain,
  createBucket,
  s3Bucket,
  workflowsPath: WORKFLOWS_PATH,
  tasksPath: TASKS_PATH,
  soflowRoot,
  includeDeciderSpawnerSchedule = true,
}) {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {},
    ...currentTemplate,
  }

  if (createBucket) {
    template.Resources.StackBucket = {
      Type: 'AWS::S3::Bucket',
      Properties: {
        BucketName: s3Bucket
      }
    }
  }


  function addLambdaFunction(opts) {
    Object.assign(
      template.Resources,
      lambdaFunctionWithAliasedVersion({
        ...opts,
        version,
        namespace,
        code,
        codeSha256,
      })
    )
  }

  if (codeSha256) {
    addLambdaFunction({
      name: 'CustomTypes',
      handler: path.join(soflowRoot, 'lib/SWF/CFCustomTypes.default'),
      timeout: MAXIMUM_LAMBDA_EXECUTION_TIME,
    })
  }
  if (tasks) {
    const hexVersion = new Buffer(version).toString('hex')

    template.Resources.SWFDomain = {
      Type: 'Custom::SWFDomain',
      Properties: {
        region: {Ref: 'AWS::Region'},
        ServiceToken: {'Fn::GetAtt': ['CustomTypesLambdaFunction', 'Arn']},
        name: domain,
      }
    }

    template.Resources.WorkflowCallbackActivityType = {
      Type: 'Custom::SWFActivityType',
      DependsOn: 'SWFDomain',
      Properties: {
        region: {Ref: 'AWS::Region'},
        ServiceToken: {'Fn::GetAtt': ['CustomTypesLambdaFunction', 'Arn']},
        domain,
        version: 'default', // No need for versioning on this one?
        name: `${namespace}_workflowCallback`,
        description: 'Activity used to provide callback when workflow completes or fails',
        // defaultTaskHeartbeatTimeout: 'STRING_VALUE',
        // defaultTaskList: {
        //   name: 'STRING_VALUE' /* required */
        // },
        // defaultTaskPriority: 'STRING_VALUE',
        defaultTaskScheduleToCloseTimeout: '5',
        defaultTaskScheduleToStartTimeout: '10',
        defaultTaskStartToCloseTimeout: '5',
      }
    }

    for (const workflowName of Object.keys(workflows)) {
      template.Resources[`SWFWorkflowType${workflowName}${hexVersion}`] = {
        Type: 'Custom::SWFWorkflowType',
        DependsOn: 'SWFDomain',
        Properties: {
          region: {Ref: 'AWS::Region'},
          ServiceToken: {'Fn::GetAtt': ['CustomTypesLambdaFunction', 'Arn']},
          domain,
          name: `${namespace}_${workflowName}`,
          version,
          lambdaRole: {'Fn::GetAtt': ['swfRole', 'Arn']},
          defaultTaskListName: `${namespace}_${version}`,
        }
      }
    }

    template.Resources.swfRole = {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: ['swf.amazonaws.com']
            },
            Action: ['sts:AssumeRole']
          }]
        },
        RoleName: `${namespace}-swfRole`,
        Policies: [{
          PolicyName: 'default',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Action: [
                'lambda:InvokeFunction'
              ],
              Resource: ['*']
            }]
          }
        }]
      }
    }


    // Default lambda role
    template.Resources.defaultLambdaRole = {
      Type: 'AWS::IAM::Role',
      Properties: {
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
        RoleName: `${namespace}-defaultLambdaRole`,
        Policies: [{
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
                Action: ['swf:RegisterWorkflowType', 'swf:RegisterDomain', 'swf:*'],
                Resource: '*',
              },
              { // For custom workflow cf type
                Effect: 'Allow',
                Action: ['iam:PassRole'],
                Resource: '*',
              },
              { // for decider spawner
                Effect: 'Allow',
                Action: ['lambda:InvokeFunction'],
                Resource: '*',
              }
            ]
          }
        }]
      }
    }

    // TODO FIX handler path
    addLambdaFunction({
      name: 'decider',
      handler: path.join(soflowRoot, 'lib/SWF/Decider.default'),
      env: {
        WORKFLOWS_PATH,
        TASKS_PATH,
        SOFLOW_WORKFLOWS_VERSION: version,
        SOFLOW_NAMESPACE: namespace,
        SOFLOW_DOMAIN: domain,
        DEBUG: 'soflow'
      },
      timeout: MAXIMUM_LAMBDA_EXECUTION_TIME,
    })

    addLambdaFunction({
      name: 'deciderSpawner',
      handler: path.join(soflowRoot, 'lib/SWF/DeciderSpawner.default'),
      env: {
        SOFLOW_WORKFLOWS_VERSION: version,
        SOFLOW_NAMESPACE: namespace,
        SOFLOW_DOMAIN: domain,
        SOFLOW_DECIDER_FUNCTION: { 'Fn::GetAtt': ['deciderLambdaFunction', 'Arn'] },
      },
      timeout: MAXIMUM_LAMBDA_EXECUTION_TIME,
    })

    if (includeDeciderSpawnerSchedule) {
      template.Resources.DeciderSpawnerScheduledRule = {
        Type: 'AWS::Events::Rule',
        Properties: {
          Description: 'Runs DeciderSpawner every 5 minutes',
          ScheduleExpression: 'rate(5 minutes)',
          State: 'ENABLED',
          Targets: [{
            Arn: { 'Fn::GetAtt': ['deciderSpawnerLambdaFunction', 'Arn'] },
            Id: 'DeciderSpawner',
            Input: JSON.stringify({})
          }]
        }
      }

      template.Resources.PermissionForScheduledRuleToExecuteDeciderSpawner = {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: {Ref: 'deciderSpawnerLambdaFunction'},
          Action: 'lambda:InvokeFunction',
          Principal: 'events.amazonaws.com',
          SourceArn: { 'Fn::GetAtt': ['DeciderSpawnerScheduledRule', 'Arn'] }
        }
      }
    }


    // TASKS
    for (const taskName of Object.keys(tasks)) {
      const {
        timeout,
        description,
        lambda,
      } = tasks[taskName]

      let role

      if (lambda && lambda.rolePolicyStatement) {
        const roleName = `${namespace}-${taskName}-${version}`
        const resourceId = sanitizeLogicalId(`${roleName}-role`)
        template.Resources[resourceId] = {
          Type: 'AWS::IAM::Role',
          Properties: {
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
            Policies: [{
              PolicyName: 'default',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                    Resource: 'arn:aws:logs:*:*:*'
                  },
                  ...lambda.rolePolicyStatement
                ],
              }
            }]
          }
        }

        role = {'Fn::GetAtt': [resourceId, 'Arn']}
      }

      addLambdaFunction({
        name: `${taskName}`,
        handler: path.join(soflowRoot, `lib/SWF/LambdaTaskHandlers.${taskName}`),
        timeout,
        description,
        env: {TASKS_PATH},
        role,
        memorySize: lambda && lambda.memorySize
      })
    }
  }

  return template
}

export default generateStackTemplate
