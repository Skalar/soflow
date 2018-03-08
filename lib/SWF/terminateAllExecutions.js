const config = require('../config')

async function terminateAllExecutions({
  namespace = config.namespace,
  domain = config.swfDomain,
  reason = 'no reason given',
  childPolicy = 'TERMINATE',
} = {}) {
  const swf = new config.AWS.SWF()

  let result

  while (!result || result.nextPageToken) {
    result = await swf
      .listOpenWorkflowExecutions({
        domain,
        tagFilter: {
          tag: namespace,
        },
        startTimeFilter: {
          oldestDate: 123456789, // 1970
          latestDate: new Date(),
        },
      })
      .promise()

    for (const {execution: {workflowId, runId}} of result.executionInfos) {
      try {
        await swf
          .terminateWorkflowExecution({
            domain,
            workflowId,
            runId,
            reason,
            childPolicy,
          })
          .promise()
      } catch (error) {
        if (error.code !== 'UnknownResourceFault') throw error
      }
    }

    if (!result.nextPageToken) {
      break
    }
  }
}

module.exports = terminateAllExecutions
