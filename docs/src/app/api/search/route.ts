import directusApi from '@/directus/client'
import { NextRequest, NextResponse } from 'next/server'
import { getQuery } from 'ufo'
import { readItems } from '@directus/sdk'
import { SearchCollectionType } from '@/types/directus'

/**
 * @todo fix translation fields.
 * */
function mapEntity({
  entity,
  type,
  urlPattern,
  description = '',
  image = '',
}: {
  entity: any
  type: string
  urlPattern: string
  description?: string
  image?: string
}) {
  return {
    type,
    title: entity.title,
    description,
    image,
    url: urlPattern.replace(':slug', entity.slug),
  }
}

const mapping = {
  posts: (post: any) =>
    mapEntity({
      entity: post,
      type: 'post',
      urlPattern: '/posts/:slug',
      description: post.summary,
      image: post.image,
    }),
  projects: (project: any) =>
    mapEntity({
      entity: project,
      type: 'project',
      urlPattern: '/projects/:slug',
      description: project.summary,
      image: project.image,
    }),
  pages: (page: any) =>
    mapEntity({
      entity: page,
      type: 'page',
      urlPattern: '/:slug',
    }),
  categories: (category: any) =>
    mapEntity({
      entity: category,
      type: 'category',
      urlPattern: '/posts/categories/:slug',
    }),
  help_articles: (article: any) =>
    mapEntity({
      entity: article,
      type: 'article',
      urlPattern: '/help/articles/:slug',
      description: '',
      image: '',
    }),
} as const

type MappingKey = keyof typeof mapping

function mapResults(collection: MappingKey, results: any[]) {
  return results.map(mapping[collection])
}

function validCollections(collections: string | string[]): SearchCollectionType[] {
  if (typeof collections === 'string') {
    collections = [collections]
  }

  const validTypes = Object.keys(mapping) as SearchCollectionType[]

  if (
    !collections ||
    !collections.every(collection => validTypes.includes(collection as SearchCollectionType))
  ) {
    throw new Error('Invalid or missing collections param')
  }

  return collections as SearchCollectionType[]
}

export async function GET(req: NextRequest, ctx: { params: any }) {
  const query = getQuery(req.url)

  let { collections, search, raw } = query

  const newCollections = validCollections(collections as string | string[])

  const results = await Promise.all(
    newCollections.map(async (collection) => {
      const res = await directusApi.request(
        readItems(collection as any, { search: search ? search.toString() : '' })
      )

      if (raw) {
        return res
      } else {
        return mapResults(collection, res)
      }
    })
  )

  return NextResponse.json(results.flat())
}
