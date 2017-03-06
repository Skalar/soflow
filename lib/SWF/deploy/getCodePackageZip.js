import archiver from 'archiver'
import {sync as globSync} from 'glob'
import path from 'path'
import {createWriteStream, realpathSync} from 'fs'
import {createHash} from 'crypto'

async function getCodePackageZip(args = {}) {
  const {
    codeRoot,
    files,
    ignore,
  } = args

  const zip = archiver.create('zip')
  const hash = createHash('sha256')
  hash.setEncoding('base64')
  zip.on('error', error => {
    console.log('zip error', error)
  })
  zip.on('data', data => hash.write(data))

  const zipFile = createWriteStream('/test.zip') // TODO fix path

  await new Promise(resolve => zipFile.on('open', resolve))

  zip.pipe(zipFile)

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
    // const stats = lstatSync(fullPath)
    // console.log(`${filePath} -> ${realpathSync(fullPath)}`)
    // console.log('filepath', path.resolve(codeRoot, filePath))
    zip.file(
      realpathSync(fullPath),
      {name: filePath}
    )
  }
  zip.finalize()

  zip.on('error', error => {
    console.log('zip error', error)

    throw error
  })

  await new Promise(
    (resolve, reject) => {
      zipFile.on('error', error => {
        console.log('zipfile error', error)
        reject(error)
      })

      zipFile.on('close', () => {
        resolve()
      })
    }
  )

  hash.end()


  return {
    path: '/test.zip',
    sha256: hash.read(),
  }
  // include decider and deciderspawner automatically
}

export default getCodePackageZip
