import AWS from 'aws-sdk'
const iam = new AWS.IAM()

async function createRoleWithInlinePolicy({
  AssumeRolePolicyDocument,
  RoleName,
  PolicyName = 'default',
  PolicyDocument,
}) {
  let role

  try {
    role = await iam.createRole({
      AssumeRolePolicyDocument: JSON.stringify(AssumeRolePolicyDocument),
      RoleName,
    }).promise()
  }
  catch (error) {
    if (error.code !== 'EntityAlreadyExists') {
      throw error
    }

    await iam.updateAssumeRolePolicy({
      RoleName,
      PolicyDocument: JSON.stringify(AssumeRolePolicyDocument),
    }).promise()

    role = await iam.getRole({RoleName}).promise()
  }

  await iam.putRolePolicy({
    RoleName,
    PolicyName,
    PolicyDocument: JSON.stringify(PolicyDocument),
  }).promise()

  return role
}

export default createRoleWithInlinePolicy
