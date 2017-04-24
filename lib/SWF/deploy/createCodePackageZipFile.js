import archiver from 'archiver'
import {sync as globSync} from 'glob'
import path from 'path'
import {realpathSync} from 'fs'
import {createHash} from 'crypto'
import {statSync, createWriteStream} from 'fs'
import {tmpdir} from 'os'
import uuid from 'uuid/v4'

async function createCodePackageZipFile({
  codeRoot,
  files,
  ignore
}) {
  const zip = archiver.create('zip')


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
  const sha256base64 = hashData.toString('base64')
  const sha256hex = hashData.toString('hex')

  return {
    filePath,
    sha256base64,
    sha256hex
  }
}

export default createCodePackageZipFile
