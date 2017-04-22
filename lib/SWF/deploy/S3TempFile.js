import uuid from 'uuid/v4'
import AWS from 'aws-sdk'

class TempFile {
  constructor({bucket, name = uuid(), prefix}) {
    this.s3 = new AWS.S3()
    this.s3Location = {
      Bucket: bucket,
      Key: `${prefix}${name}`,
    }
  }

  put(body, params = {}) {
    return this.s3.putObject({
      ...this.s3Location,
      Body: body,
      ...params,
    }).promise()
  }

  delete() {
    return this.s3.deleteObject(this.s3Location).promise()
  }

  getSignedUrl() {
    return this.s3.getSignedUrl('getObject', this.s3Location)
  }
}

export default TempFile
