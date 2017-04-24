const DEFAULT_LAMBDA_TIMEOUT = 60

// TODO bruke sha256 for å name versjon. kun alias som skal bruke developer given version

function lambdaFunctionWithAliasedVersion({
  name,
  version,
  namespace,
  env = {},
  description: Description = 'SoFlow task',
  memorySize: MemorySize = 128,
  role: Role = {'Fn::GetAtt': ['defaultLambdaRole', 'Arn']},
  code: Code,
  codeSha256: CodeSha256,
  runTime: Runtime = 'nodejs6.10',
  handler: Handler,
  timeout: Timeout = DEFAULT_LAMBDA_TIMEOUT,
}) {
  const FunctionName = `${namespace}_${name}`
  const VersionName = `${name}LambdaFunctionVersion${new Buffer(CodeSha256).toString('hex')}`
  const VersionAliasName = `${name}LambdaFunctionVersionAlias${new Buffer(version).toString('hex')}`

  return {
    [`${name}LambdaFunction`]: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        FunctionName,
        Description,
        Environment: {
          Variables: env
        },
        MemorySize,
        Role,
        Code,
        Handler,
        Timeout,
        Runtime,
      }
    },

    [VersionName]: {
      Type: 'AWS::Lambda::Version',
      Properties: {
        FunctionName: {'Fn::GetAtt': [`${name}LambdaFunction`, 'Arn']},
        CodeSha256,
        Description,
      }
    },

    [VersionAliasName]: {
      Type: 'AWS::Lambda::Alias',
      Properties: {
        FunctionName, Description,
        FunctionVersion: {'Fn::GetAtt': [VersionName, 'Version']},
        Name: version
      }
    },
  }
}

export default lambdaFunctionWithAliasedVersion
