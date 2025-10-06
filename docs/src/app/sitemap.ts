import i18nConfig from '@/i18n/i18nConfig'
import directusApi from '@/directus/client'
import { readItems } from '@directus/sdk'
import { MetadataRoute } from 'next'
import type {
  PagesSitemap,
  PostsSitemap,
  ProjectsSitemap
} from '@/directus/types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const injectLangCode = (lang: string): string => {
    const isDefaultLocale =
      lang !== '' &&
      typeof lang !== 'undefined' &&
      lang === process.env.NEXT_PUBLIC_LOCALE_DEFAULT
    return isDefaultLocale ? '' : `/${lang}`
  }

  const fetchPages = async (): Promise<any[]> => {
    try {
      const data = await directusApi.request(
        readItems('pages' as any, {
          fields: ['*', { translations: ['languages_code', 'permalink'] }]
        })
      )
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const fetchPosts = async (): Promise<any[]> => {
    try {
      const data = await directusApi.request(
        readItems('posts' as any, {
          fields: ['slug', 'date_updated', { translations: ['languages_code'] }]
        })
      )
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const fetchProjects = async (): Promise<any[]> => {
    try {
      const data = await directusApi.request(
        readItems('pages_projects' as any, {
          fields: ['id', 'title']
        })
      )
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const [posts, pages, projects] = await Promise.all([
    fetchPosts(),
    fetchPages(),
    fetchProjects()
  ])

  // ✅ Trang tĩnh gốc (home, posts, projects, help)
  const staticRoutes = ['/', '/projects', '/posts', '/help']
  const allRootPages: MetadataRoute.Sitemap = []

  i18nConfig.locales.forEach((locale) => {
    staticRoutes.forEach((route) => {
      allRootPages.push({
        url: `${baseUrl}${injectLangCode(locale)}${route}`,
        lastModified: new Date()
      })
    })
  })

  // ✅ Posts có nhiều ngôn ngữ
  const allPosts: MetadataRoute.Sitemap = (Array.isArray(posts) ? posts : []).flatMap((post) =>
    Array.isArray(post.translations)
      ? post.translations.map((translation: any) => ({
          url: `${baseUrl}${injectLangCode(translation.languages_code)}/posts/${post.slug}`,
          lastModified: new Date(post.date_updated ?? '')
        }))
      : []
  )

  // ✅ Pages có nhiều ngôn ngữ
  const allPages: MetadataRoute.Sitemap = (Array.isArray(pages) ? pages : []).flatMap((page) =>
    Array.isArray(page.translations)
      ? page.translations.map((translation: any) => ({
          url: `${baseUrl}${injectLangCode(translation.languages_code)}${translation.permalink || ''}`,
          lastModified: new Date(page.date_updated ?? '')
        }))
      : []
  )

  // ✅ Projects là global, không có translation
  const allProjects: MetadataRoute.Sitemap = (Array.isArray(projects) ? projects : []).map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date()
  }))

  return [...allRootPages, ...allPosts, ...allPages, ...allProjects]
}
