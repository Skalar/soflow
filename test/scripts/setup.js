const {SWF} = require('soflow')

async function setup() {
  if (!process.env.PROFILES || process.env.PROFILES.includes('swf')) {
    return SWF.Orchestration.setup({
      codeRoot: '/soflow',
      workflowsPath: 'test-6_13_0/workflows',
      tasksPath: 'test-6_13_0/tasks',
      includeBaseFiles: false,
      files: [
        [
          'lambda-modules/**',
          path => path.replace('lambda-modules', 'node_modules'),
        ],
        ['lib-6_13_0/**', path => !path.endsWith('.test.js')],
        'test-6_13_0/workflows/**',
        'test-6_13_0/tasks/**',
        '+(package.json|main.js)',
      ],
      ignore: [
        '**/*.md',
        'lambda-modules/bunyan/docs/**',
        '**/AUTHORS',
        '**/CHANGELOG',
        '**/LICENSE.txt',
        '**/bin/**',
      ],
      soflowPath: '.',
      createBucket: true,
      enableDeciderSchedule: false,
      progressIndicator: true,
      deciderEnvironment: {
        MY_FIRST_VARIABLE: 'test',
        MY_SECOND_VARIABLE: 'ing'
      }
    })
  }
}

if (require.main === module) {
  setup().catch(error => {
    console.dir(error)
    process.exit(0)
  })
}
