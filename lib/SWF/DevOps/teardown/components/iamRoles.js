import AWS from 'aws-sdk'

const iam = new AWS.IAM({region: process.env.AWS_DEFAULT_REGION})

export default function({
  namespace,
}) {
  return {
    async removeIamRoles() {
      let result

      while (!result || result.NextMarker) {
        result = await iam.listRoles(
          result && result.NextMarker ? {Marker: result.NextMarker} : {}
        ).promise()

        await Promise.all(
          result.Roles.filter(
            ({RoleName}) => RoleName.startsWith(`${namespace}_`)
          ).map(
            async ({RoleName}) => {
              const {PolicyNames} = await iam.listRolePolicies({RoleName}).promise()

              await Promise.all(
                PolicyNames.map(
                  PolicyName => iam.deleteRolePolicy({
                    PolicyName,
                    RoleName,
                  }).promise()
                )
              )

              return iam.deleteRole({RoleName}).promise()
            }
          )
        )

        if (!result.NextMarker) {
          break
        }
      }
    }
  }
}
