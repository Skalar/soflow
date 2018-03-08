const config = require('../../../../config')

const {eachLimit, asyncify} = require('async')

function deleteRoles(roles) {
  const iam = new config.AWS.IAM()

  return new Promise((resolve, reject) => {
    eachLimit(
      roles,
      4,
      asyncify(async ({RoleName}) => {
        const {PolicyNames} = await iam.listRolePolicies({RoleName}).promise()

        await Promise.all(
          PolicyNames.map(PolicyName =>
            iam
              .deleteRolePolicy({
                PolicyName,
                RoleName,
              })
              .promise()
          )
        )

        return await iam.deleteRole({RoleName}).promise()
      }),
      err => (err ? reject(err) : resolve())
    )
  })
}

module.exports = function({namespace}) {
  const iam = new config.AWS.IAM()

  return {
    async removeIamRoles() {
      let result

      while (!result || result.Marker) {
        result = await iam
          .listRoles(result && result.Marker ? {Marker: result.Marker} : {})
          .promise()
        try {
          await deleteRoles(
            result.Roles.filter(({RoleName}) => RoleName.startsWith(namespace))
          )
        } catch (error) {
          console.dir({error}, {showHidden: false, depth: null})
        }
      }
    },
  }
}
