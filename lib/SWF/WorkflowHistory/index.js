import LambdaFunction from './LambdaFunction'
import Timer from './Timer'
import SignalReceived from './SignalReceived'
import WorkflowExecution from './WorkflowExecution'
import ActivityTask from './ActivityTask'
import ChildWorkflow from './ChildWorkflow'

function WorkflowHistory(events) {
  return {
    lambdaFunction: new LambdaFunction(events),
    activityTask: new ActivityTask(events),
    timer: new Timer(events),
    signalReceived: new SignalReceived(events),
    workflowExecution: new WorkflowExecution(events),
    childWorkflow: new ChildWorkflow(events),
  }
}

export default WorkflowHistory
