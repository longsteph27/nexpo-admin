import { CollectionType, RestCommand } from '@directus/sdk'
import type {
  Sites,
  Globals,
  Navigation,
  Pages,
  Posts,
  Forms,
  HelpArticles,
  HelpCollections,
  HelpFeedback,
  Categories,
  Projects,
  Team
} from './directus-types'

declare module '@directus/sdk' {
  interface DirectusCollections extends CollectionType {
    help_collections: HelpCollections
    help_articles: HelpArticles
    help_feedback: HelpFeedback
    forms: Forms
    pages: Pages
    posts: Posts
    navigation: Navigation
    globals: Globals
    sites: Sites
    categories: Categories
    form_submissions: any
    projects: Projects
    team: Team
  }
}

export type Schema = DirectusCollections
export type Collection = keyof Schema
export type Field = string
export type Relation = string

export type ValidCollectionType = keyof DirectusCollections
export type SearchCollectionType = 'posts' | 'pages' | 'categories' | 'projects' | 'help_articles'
export type FormCollectionType = 'form_submission' | 'form_submissions'

export type { RestCommand } 