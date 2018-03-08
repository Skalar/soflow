const registerWorkflowType = require('../../registerWorkflowType')

module.exports = function({
  workflowPrefix,
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
              name: [workflowPrefix, workflowName].filter(v => v).join('_'),
              version,
            })
          },
        ],
      }),
      {}
    ),
    'workflowType.DeciderControl': [
      'domain',
      async () => {
        return registerWorkflowType({
          domain,
          name: [workflowPrefix, 'DeciderControl'].filter(v => v).join('_'),
          description:
            'This special workflow allows us to notify/signal the running decider special events, for example to tell the decider to shutdown.',
          version: 'default',
        })
      },
    ],
  }
}
