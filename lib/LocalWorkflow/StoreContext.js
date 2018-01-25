const MAX_OLD_ITEM_SIZE = 20

export const ACTIVE = 'active'
export const FAILED = 'failed'
export const COMPLETE = 'complete'

const store = {}
store[ACTIVE] = {}
store[FAILED] = []
store[COMPLETE] = []


function purgeOldItems(listName) {
  while (store[listName].length > MAX_OLD_ITEM_SIZE) {
    store[listName].shift()
  }
}

export function register(workflowId, context) {
  store[ACTIVE][workflowId] = context
}

export function markAsFailed(workflowId) {
  store[FAILED].push({workflowId, context: store[ACTIVE][workflowId]})
  delete store[ACTIVE][workflowId]
  purgeOldItems(FAILED)
}

export function markAsComplete(workflowId) {
  store[COMPLETE].push({workflowId, context: store[ACTIVE][workflowId]})
  delete store[ACTIVE][workflowId]
  purgeOldItems(COMPLETE)
}

export function get(workflowId) {
  return store[ACTIVE][workflowId] || null
}

export function checkState(workflowId) {
  if (get(workflowId)) {
    return ACTIVE
  }
  if (store[FAILED].find(el => el.workflowId === workflowId)) {
    return FAILED
  }
  if (store[COMPLETE].find(el => el.workflowId === workflowId)) {
    return COMPLETE
  }
  return null
}
