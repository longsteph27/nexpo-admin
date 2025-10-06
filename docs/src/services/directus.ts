import { createDirectus, rest, readItems } from '@directus/sdk'
import type { Schema, Collection } from '@/types/directus'

const directus = createDirectus<Schema>(process.env.NEXT_PUBLIC_DIRECTUS_URL!).with(rest())

export async function getCollections() {
  return directus.request(readItems('sites', {
    fields: [
      '*',
      'id', 
      'name', 
      'slug']
  }))
}

export async function getFields() {
  return directus.request(readItems('forms', {
    fields: [
      '*', 
      'id', 
      'name', 
      'type']
  }))
}

export async function getRelations() {
  return directus.request(readItems('navigation', {
    fields: [
      '*',
      'id', 
      'title', 
      'type']
  }))
}

export async function getCollectionFields(collection: Collection) {
  return directus.request(readItems('forms', {
    fields: [
      '*',
      'id', 
      'name', 
      'type'
    ],
    filter: {
      collection: {
        _eq: collection
      }
    }
  }))
}

export async function getCollectionRelations(collection: Collection) {
  return directus.request(readItems('navigation', {
    fields: [
      '*',
      'id', 
      'title', 
      'type'
    ],
    filter: {
      collection: {
        _eq: collection
      }
    }
  }))
}

export async function getCollectionById(id: string) {
  return directus.request(readItems('sites', {
    fields: ['*'],
    filter: {
      id: {
        _eq: id
      }
    }
  }))
}

export async function getRelationsByCollection(collection: Collection) {
  return directus.request(readItems('navigation', {
    fields: ['id', 'title', 'type'],
    filter: {
      _or: [
        {
          many_collection: {
            _eq: collection
          }
        },
        {
          one_collection: {
            _eq: collection
          }
        }
      ]
    }
  }))
} 