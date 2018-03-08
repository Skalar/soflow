#!/usr/bin/env node
const ora = require('ora')
const config = require('../../lib/config')
const {SWF} = require('soflow')

async function cleanUpS3Buckets(namespace = 'soflow') {
  const s3 = new config.AWS.S3()

  if (!process.env.PROFILES || process.env.PROFILES.includes('SWF')) {
    const listResult = await s3.listBuckets().promise()
    const baseDescription = `Destroying s3 buckets '${namespace}*'`
    const spinner = ora(`${baseDescription} [listing buckets..]`).start()
    spinner.color = 'yellow'
    const bucketNames = listResult.Buckets.filter(bucket =>
      bucket.Name.startsWith(namespace)
    ).map(bucket => bucket.Name)

    let counter = 0
    for (const bucketName of bucketNames) {
      spinner.text = `${baseDescription} [${++counter}/${bucketNames.length}]`

      try {
        await SWF.Orchestration.S3.destroyBucket(bucketName)
      } catch (error) {
        if (!error.code === 'NoSuchBucket') {
          throw error
        }
      }
    }
    spinner.stop()
  }
}

if (require.main === module) {
  cleanUpS3Buckets(process.argv[2]).catch(error => {
    console.dir(error)
    process.exit(0)
  })
}
