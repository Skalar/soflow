const destroyBucket = require('../../S3/destroyBucket')

module.exports = function({removeBucket, s3Bucket}) {
  return {
    async s3Bucket() {
      if (!removeBucket) return

      return await destroyBucket(s3Bucket)
    },
  }
}
