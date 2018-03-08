const config = require('../../../config')

async function removeBucket(Bucket) {
  const s3 = new config.AWS.S3()
  try {
    let listResult
    do {
      listResult = await s3.listObjects({Bucket}).promise()

      for (const {Key} of listResult.Contents) {
        await s3.deleteObject({Bucket, Key}).promise()
      }
    } while (listResult.IsTruncated)

    return await s3.deleteBucket({Bucket}).promise()
  } catch (error) {
    if (error.code !== 'NoSuchBucket') throw error
  }
}

module.exports = removeBucket
