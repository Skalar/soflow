#!/usr/bin/env node

import AWS from 'aws-sdk'
import {execSync} from 'child_process'
import {createReadStream} from 'fs'

const s3 = new AWS.S3({region: 'eu-west-1'})

async function publish() {
  execSync('npm pack')
  await s3.upload({
    Bucket: 'soflow-package',
    Key: 'soflow-latest.tgz',
    Body: createReadStream('soflow-0.0.1.tgz'),
    ACL: 'public-read',
  }).promise()
  execSync('rm soflow-0.0.1.tgz')
}

publish()
