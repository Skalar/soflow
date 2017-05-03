import executeWorkflow from '~/lib/SWF/executeWorkflow'

async function shutdownDeciders({
  domain,
  namespace,
  version,
}) {
  // The current architecture allows for a maximum of 2 concurrent deciders.
  // Since we cannot get a list of running deciders, to ensure that all deciders
  // are shut down, we spawn 2 DeciderControl workflows - which time out if
  // there are no running decider(s) to receive them.
  const MAX_CONCURRENT_DECIDERS = 2

  for (let i = 0; i <= MAX_CONCURRENT_DECIDERS; i++) {
    try {
      executeWorkflow({
        domain,
        namespace,
        version,
        id: `${namespace}_DeciderControl_${i}`,
        type: 'DeciderControl',
        workflowTypeVersion: 'default',
        executionStartToCloseTimeout: 2,
        waitForCompletion: false,
        // Currently ignored, but for future use when DeciderControl can do more things
        input: {
          action: 'shutdown'
        },
      })
    }
    catch (error) {
      // do nothing
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000))
}

export default shutdownDeciders
