const config = require('../../../../config')
const archiver = require('archiver')
const {promisify = require('promisify-node')} = require('util')
const glob = promisify(require('glob'))
const path = require('path')
const {tmpdir} = require('os')
const fs = require('fs')

const stat = promisify(fs.stat)
const realpath = promisify(fs.realpath)
const unlink = promisify(fs.unlink)

const {createWriteStream, createReadStream} = fs
const {createHash} = require('crypto')
const uuid = require('uuid/v4')

module.exports = function({
  s3Bucket,
  s3Prefix,
  codeRoot,
  files,
  soflowPath,
  modulesPath,
  includeBaseFiles,
  ignore,
}) {
  const s3 = new config.AWS.S3()

  const baseFilesGlobs = [
    `${soflowPath}/lib/**`,
    `${soflowPath}/+(package.json|main.js)`,
    `${modulesPath}/serialize-error/**`,
    `${modulesPath}/lodash.get/**`,
  ]
  // can we solve issue by include relative to node_modules all required depdencies both within soflow and outside?

  return {
    uploadCode: [
      's3Bucket',
      async () => {
        const zip = archiver('zip', {zlib: {level: 1}})

        const filePath = [tmpdir(), uuid()].join('/')

        const hash = createHash('sha256')
        const outputStream = createWriteStream(filePath)

        const zipPromise = new Promise((resolve, reject) => {
          outputStream.on('close', resolve)
          zip.on('error', reject)
        })

        zip.pipe(hash)
        zip.pipe(outputStream)

        let pathsAddedToZip = {}

        for (const entry of [
          ...(includeBaseFiles ? baseFilesGlobs : []),
          ...files,
        ]) {
          let filePattern, transform
          if (Array.isArray(entry)) {
            filePattern = entry[0]
            transform = entry[1]
          } else {
            filePattern = entry
          }

          const filePaths = await glob(filePattern, {
            cwd: codeRoot,
            dot: true,
            silent: true,
            follow: false,
            nodir: true,
            ignore,
          })

          for (const filePath of filePaths) {
            let zipFilePath = filePath

            if (transform) {
              const transformed = transform(filePath)
              if (!transformed) {
                continue
              } else if (transformed === true) {
                zipFilePath = filePath
              } else {
                zipFilePath = transformed
              }
            }

            if (pathsAddedToZip[zipFilePath]) {
              continue
            }

            pathsAddedToZip[zipFilePath] = true

            const fullPath = path.resolve(codeRoot, filePath)
            const stats = await stat(fullPath)
            // Set neutral timestamps for better sha256 diffing
            stats.atime = stats.mtime = stats.ctime = new Date(0)

            zip.file(await realpath(fullPath), {name: zipFilePath, stats})
          }
        }

        pathsAddedToZip = undefined
        zip.finalize()

        await zipPromise

        const hashData = hash.read()
        // const sha256base64 = hashData.toString('base64')
        const sha256hex = hashData.toString('hex')

        const s3Location = {
          Bucket: s3Bucket,
          Key: `${s3Prefix}${sha256hex}.zip`,
        }

        await s3
          .upload({
            ...s3Location,
            Body: createReadStream(filePath),
          })
          .promise()

        await unlink(filePath)

        return s3Location
      },
    ],
  }
}
