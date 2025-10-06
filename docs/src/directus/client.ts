import { getDirectusURL } from '@/lib/utils/directus-helpers'
import { createDirectus, rest, authentication } from '@directus/sdk'
import type { Schema } from './schema'

const directus = createDirectus<Schema>(getDirectusURL())
  .with(rest())
  .with(authentication('json', { autoRefresh: false }))

const adminToken = process.env.DIRECTUS_ADMIN_TOKEN
if (adminToken && adminToken !== 'your-directus-admin-token') {
  directus.setToken(adminToken)
} else {
  console.warn('[Directus] No valid admin token found. Some operations may fail.')
}

export default directus 