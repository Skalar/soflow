import archiver from 'archiver'
import {sync as globSync} from 'glob'
import path from 'path'
import {tmpdir} from 'os'
import {
  realpathSync,
  statSync,
  unlinkSync,
  createReadStream,
  createWriteStream,
} from 'fs'
import {createHash} from 'crypto'
import uuid from 'uuid/v4'
import AWS from 'aws-sdk'

const s3 = new AWS.S3({region: process.env.AWS_DEFAULT_REGION})

export default function({
  s3Bucket,
  s3Prefix,
  codeRoot,
  files,
  ignore,
}) {
  return {
    uploadCode: [
      's3Bucket',
      async () => {
        const zip = archiver('zip', {zlib: {level: 1}})

        const filePath = [tmpdir(), uuid()].join('/')
        const hash = createHash('sha256')
        const outputStream = createWriteStream(filePath)

        const zipPromise = new Promise(
          (resolve, reject) => {
            outputStream.on('close', resolve)
            zip.on('error', reject)
          }
        )

        zip.pipe(hash)
        zip.pipe(outputStream)

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

        await zipPromise

        const hashData = hash.read()
        // const sha256base64 = hashData.toString('base64')
        const sha256hex = hashData.toString('hex')

        const s3Location = {
          Bucket: s3Bucket,
          Key: `${s3Prefix}${sha256hex}.zip`,
        }

        await s3.upload({
          ...s3Location,
          Body: createReadStream(filePath)
        }).promise()

        unlinkSync(filePath)

        return s3Location
      }
    ]
  }
}
