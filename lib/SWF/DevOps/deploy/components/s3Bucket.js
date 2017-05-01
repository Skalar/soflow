import AWS from 'aws-sdk'
const s3 = new AWS.S3({region: process.env.AWS_DEFAULT_REGION})

export default function({
  createBucket,
  teardown,
  s3Bucket,
}) {
  if (teardown) {
    console.log('Teardown')
  } else {
    return {
      async s3Bucket() {
        if (!createBucket) return

        try {
          return await s3.createBucket({
            Bucket: s3Bucket,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_DEFAULT_REGION
            }
          }).promise()
        }
        catch (error) {
          if (error.code !== 'BucketAlreadyOwnedByYou') {
            throw error
          }
        }
      }
    }
  }
}
