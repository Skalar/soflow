async function TaskAndWorkflowProxies({tasks: {dummy}, workflows: {Dummy}}) {
  const taskResult = await dummy({result: 'task-success'})
  const childworkflowResult = await Dummy({
    id: 'task-and-workflow-proxies-dummy',
    input: {
      taskOptions: {
        args: [{result: 'child-workflow-success'}],
      },
    },
    startToCloseTimeout: 5,
  })
  return {taskResult, childworkflowResult}
}

module.exports = TaskAndWorkflowProxies
