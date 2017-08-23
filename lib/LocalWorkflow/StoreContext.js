const store = {
  active: {},
  failed: {},
  completed: {},
}

export function register(workflowId, context) {
  store.active[workflowId] = context
}

export function markAsFailed(workflowId) {
  store.failed[workflowId] = store.active[workflowId]
  delete store.active[workflowId]
}

export function markAsComplete(workflowId) {
  store.completed[workflowId] = store.active[workflowId]
  delete store.active[workflowId]
}

export function get(workflowId) {
  return store.active[workflowId]
}
