import {camelCase} from 'lodash'

function sanitizeLogicalId(id) {
  return camelCase(id).replace(/^[A-Za-z0-9]/g, '')
}

export default sanitizeLogicalId
