import {put} from 'axios'
import WorkflowType from './WorkflowType'
import ActivityType from './ActivityType'
import Domain from './Domain'

const types = {
  'Custom::SWFWorkflowType': WorkflowType,
  'Custom::SWFDomain': Domain,
  'Custom::SWFActivityType': ActivityType,
}

async function CFCustomTypes(event, context, callback) {
  console.log('event', event)

  const {
    LogicalResourceId,
    RequestId,
    StackId,
    ResponseURL,
  } = event

  try {
    const resourceFunction = types[event.ResourceType]

    if (!resourceFunction) {
      throw new Error(`Unknown resource type ${event.ResourceType}`)
    }

    const resultData = await resourceFunction(event)

    await put(ResponseURL, {
      Status: 'SUCCESS',
      StackId,
      RequestId,
      LogicalResourceId,
      ...resultData,
    }, {headers: {'content-type': ''}})

    return callback()
  }
  catch (error) {
    console.error('error', error)

    await put(ResponseURL, {
      Status: 'FAILED',
      Reason: `${error}`,
      StackId,
      RequestId,
      LogicalResourceId,
      PhysicalResourceId: 'Unknown',
    }, {headers: {'content-type': ''}})
    return callback()
  }
}

export default CFCustomTypes
export {types}
