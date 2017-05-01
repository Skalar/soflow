import {createRoleWithInlinePolicy} from '~/lib/SWF/DevOps/deploy/helpers'

export default function({
  namespace,
}) {
  const RoleName = `${namespace}_swfRole`

  return {
    async swfLambdaRole() {
      return createRoleWithInlinePolicy({
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
        RoleName,
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
      })
    }
  }
}
