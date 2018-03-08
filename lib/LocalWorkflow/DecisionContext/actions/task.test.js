const test = require('ava')
const proxyquire = require('proxyquire')

test('task failure', async t => {
  t.plan(3)

  const task = proxyquire('./task', {
    '../runTaskInChildProcess': (...args) => {
      t.deepEqual(
        args,
        [{}, {args: [1, 'two'], name: 'myTask', timeout: 10}],
        'calls the task with the correct arguments'
      )

      throw new Error('Some error')
    },
  })

  const context = {}

  try {
    await task(context, {
      name: 'myTask',
      startToCloseTimeout: 10,
      args: [1, 'two'],
    })
  } catch (error) {
    t.truthy(error, 'rejects the promise')
    t.is(
      error.toString(),
      'Error: Some error',
      'passes on the error from the task'
    )
  }
})

test('task success', async t => {
  t.plan(2)
  const task = proxyquire('./task', {
    '../runTaskInChildProcess': (...args) => {
      t.deepEqual(
        args,
        [{}, {args: [1, 'two'], name: 'myTask', timeout: 10}],
        'calls the task with the correct arguments'
      )

      return {my: 'result'}
    },
  })
  const context = {}
  const result = await task(context, {
    name: 'myTask',
    args: [1, 'two'],
    startToCloseTimeout: 10,
  })

  t.deepEqual(result, {my: 'result'}, 'resolves with the result')
})
