import test from 'blue-tape'
import Context from './Context'
import {
  register,
  get,
  markAsFailed,
  markAsComplete,
  checkState,
  ACTIVE,
  FAILED,
  COMPLETE
} from './StoreContext'

const context = new Context({
  input: 42,
})

test('StoreContext.register() and get()', t => {
  register('stored-context', context)

  t.isEqual(get('stored-context'), context, 'Should store and retrieve a context')
  t.isEqual(checkState('stored-context'), ACTIVE, 'Should be in an active state')
  t.end()
})

test('StoreContext.markAsFailed()', t => {
  register('failed-context', context)
  markAsFailed('failed-context')

  t.isEqual(get('failed-context'), null, 'Should make the context unavailable')
  t.isEqual(checkState('failed-context'), FAILED, 'Should be in a failed state')
  t.end()
})

test('StoreContext.markAsComplete()', t => {
  register('complete-context', context)
  markAsComplete('complete-context')

  t.isEqual(get('complete-context'), null, 'Should make the context unavailable')
  t.isEqual(checkState('complete-context'), COMPLETE, 'Should be in a complete state')
  t.end()
})

test('StoreContext.markAsComplete() when run many times', t => {
  for (let i = 0; i <= 21; i += 1) {
    register(`purge-complete-${i}`, context)
    markAsComplete(`purge-complete-${i}`)
  }

  t.isEqual(checkState('purge-complete-1'), null, 'should have purged the old item')
  t.end()
})
