import AWS from 'aws-sdk'

const swf = new AWS.SWF({region: process.env.AWS_DEFAULT_REGION})

async function terminateWorkflow({
  domain,
  namespace,
}) {
  let result

  while (!result || result.nextPageToken) {
    result = await swf.listOpenWorkflowExecutions({
      domain,
      tagFilter: {
        tag: namespace,
      },
      startTimeFilter: {
        oldestDate: 123456789, // 1970
        latestDate: new Date()
      },
    }).promise()

    for (const {execution: {workflowId, runId}} of result.executionInfos) {
      try {
        await swf.terminateWorkflowExecution({
          domain,
          workflowId,
          runId,
          reason: 'Developer',
          childPolicy: 'TERMINATE',
        }).promise()
      }
      catch (error) {
        if (error.code !== 'UnknownResourceFault') throw error
      }
    }

    if (!result.nextPageToken) {
      break
    }
  }
}

export default terminateWorkflow
