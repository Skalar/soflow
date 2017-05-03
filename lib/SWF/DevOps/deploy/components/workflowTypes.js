import {registerWorkflowType} from '~/lib/SWF/DevOps/deploy/helpers'

export default function({
  namespace,
  domain: domain,
  version,
  workflows,
}) {
  return {
    ...Object.keys(workflows).reduce(
      (tasks, workflowName) => ({
        ...tasks,

        [`workflowType.${workflowName}`]: [
          'domain',
          'swfLambdaRole',
          async () => {
            return registerWorkflowType({
              domain,
              name: `${namespace}_${workflowName}`,
              version,
            })
          }
        ]
      }),
      {}
    ),
    'workflowType.DeciderControl': [
      'domain',
      async () => {
        return registerWorkflowType({
          domain,
          name: `${namespace}_DeciderControl`,
          version: 'default',
        })
      }
    ]
  }
}