import archiver from 'archiver'
import {sync as globSync} from 'glob'
import path from 'path'
import {realpathSync} from 'fs'
import AWS from 'aws-sdk'
import {createHash} from 'crypto'
import {statSync} from 'fs'
import {PassThrough} from 'stream'

async function getCodePackageZip(args = {}) {
  const {
    codeRoot,
    files,
    ignore,
    region,
    s3Bucket,
    s3Prefix = '',
  } = args

  const s3 = new AWS.S3({region})

  const zip = archiver.create('zip')
  zip.on('error', error => {
    console.log('zip error', error)
  })
  const hash = createHash('sha256')
  zip.pipe(hash)


  const zipStream = new PassThrough()
  const zipStreamRef = zip.pipe(zipStream)

  const initialS3Location = {
    Bucket: s3Bucket,
    Key: `${s3Prefix}${new Date().valueOf()}.zip`,
  }

  const putPromise = s3.upload({
    ...initialS3Location,
    Body: zipStreamRef,
  }).promise()

  const filePaths = new Set()

  for (const filePattern of files) {
    globSync(
      filePattern,
      {
        cwd: codeRoot,
        dot: true,
        silent: true,
        follow: false,
        nodir: true,
        ignore,
      }
    ).forEach(path => filePaths.add(path))
  }

  for (const filePath of filePaths.values()) {
    const fullPath = path.resolve(codeRoot, filePath)
    const stats = statSync(fullPath)

    // Set neutral timestamps for better sha256 diffing
    stats.atime =
    stats.mtime =
    stats.ctime = new Date(0)

    zip.file(
      realpathSync(fullPath),
      {name: filePath, stats}
    )
  }

  zip.finalize()

  await putPromise

  const hashData = hash.read()
  const base64Hash = hashData.toString('base64')
  const hexHash = hashData.toString('hex')

  const s3Location = {
    Bucket: s3Bucket,
    Key: `${s3Prefix}${hexHash}.zip`,
  }

  await s3.copyObject({
    CopySource: `${initialS3Location.Bucket}/${initialS3Location.Key}`,
    ...s3Location,
  }).promise()

  await s3.deleteObject(initialS3Location).promise()

  return {s3Location, base64Hash, hexHash}
}

export default getCodePackageZip
