const {createRoleWithInlinePolicy} = require('../../setup/helpers')
const awsName = require('../../../awsName')

module.exports = function({namespace}) {
  const RoleName = awsName.role(`${namespace}_swfRole`)

  return {
    async swfLambdaRole() {
      return createRoleWithInlinePolicy({
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['swf.amazonaws.com'],
              },
              Action: ['sts:AssumeRole'],
            },
          ],
        },
        RoleName,
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction'],
              Resource: ['*'],
            },
          ],
        },
      })
    },
  }
}
