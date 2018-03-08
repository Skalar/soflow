const config = require('../../../../config')

module.exports = function({createBucket, s3Bucket, region}) {
  const s3 = new config.AWS.S3()

  return {
    async s3Bucket() {
      if (!createBucket) return

      try {
        return await s3
          .createBucket({
            Bucket: s3Bucket,
            CreateBucketConfiguration: {
              LocationConstraint: region,
            },
          })
          .promise()
      } catch (error) {
        if (error.code !== 'BucketAlreadyOwnedByYou') {
          throw error
        }
      }
    },
  }
}
