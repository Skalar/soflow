const config = require('../../../../config')

async function createRoleWithInlinePolicy({
  AssumeRolePolicyDocument,
  RoleName,
  PolicyName = 'default',
  PolicyDocument,
}) {
  const iam = new config.AWS.IAM()
  let role

  try {
    role = await iam
      .createRole({
        AssumeRolePolicyDocument: JSON.stringify(AssumeRolePolicyDocument),
        RoleName,
      })
      .promise()
  } catch (error) {
    if (error.code !== 'EntityAlreadyExists') {
      throw error
    }

    await iam
      .updateAssumeRolePolicy({
        RoleName,
        PolicyDocument: JSON.stringify(AssumeRolePolicyDocument),
      })
      .promise()

    role = await iam.getRole({RoleName}).promise()
  }

  await iam
    .putRolePolicy({
      RoleName,
      PolicyName,
      PolicyDocument: JSON.stringify(PolicyDocument),
    })
    .promise()

  return role
}

module.exports = createRoleWithInlinePolicy
