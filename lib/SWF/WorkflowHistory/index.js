import LambdaFunction from './LambdaFunction'
import Timer from './Timer'
import SignalReceived from './SignalReceived'
import WorkflowExecution from './WorkflowExecution'
import ActivityTask from './ActivityTask'

function WorkflowHistory(events) {
  return {
    lambdaFunction: new LambdaFunction(events),
    activityTask: new ActivityTask(events),
    timer: new Timer(events),
    signalReceived: new SignalReceived(events),
    workflowExecution: new WorkflowExecution(events),
  }
}

export default WorkflowHistory
