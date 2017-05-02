import {createRoleWithInlinePolicy} from '~/lib/SWF/DevOps/deploy/helpers'
import awsName from '~/lib/SWF/awsName'

export default function({
  namespace,
}) {
  const RoleName = awsName.role(`${namespace}_defaultLambdaRole`)

  return {
    async defaultLambdaRole() {
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
        RoleName,
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: 'arn:aws:logs:*:*:*'
            },
          ]
        }
      })
    }
  }
}
