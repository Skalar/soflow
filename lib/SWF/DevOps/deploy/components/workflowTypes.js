import {registerWorkflowType} from '~/lib/SWF/DevOps/deploy/helpers'

export default function({
  teardown,
  namespace,
  domain: domain,
  version,
  workflows,
}) {
  if (teardown) {
    // TODO
  } else {
    return Object.keys(workflows).reduce(
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
    )
  }
}
