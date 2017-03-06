import LambdaFunction from './LambdaFunction'
import Timer from './Timer'
import WorkflowExecution from './WorkflowExecution'
import ActivityTask from './ActivityTask'

function WorkflowHistory(events) {
  return {
    lambdaFunction: new LambdaFunction(events),
    activityTask: new ActivityTask(events),
    timer: new Timer(events),
    workflowExecution: new WorkflowExecution(events),
  }
}

export default WorkflowHistory
