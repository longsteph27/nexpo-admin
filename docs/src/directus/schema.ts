// types/directus-schema.ts
import type { DirectusClient as BaseDirectusClient } from '@directus/sdk'
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
  Categories
} from './types'

export interface BaseItem {
  id: string
  status: string
  date_created: string
  date_updated: string
  user_created: string
  user_updated: string
}

export interface Collection extends BaseItem {
  collection: string
  icon: string | null
  note: string | null
  display_template: string | null
  hidden: boolean
  singleton: boolean
  translations: CollectionTranslation[] | null
  archive_field: string | null
  archive_app_filter: boolean
  archive_value: string | null
  unarchive_value: string | null
  sort_field: string | null
  accountability: string | null
  color: string | null
  item_duplication_fields: string[] | null
  sort: number | null
  group: string | null
  collapse: string
}

export interface CollectionTranslation {
  id: number
  collection: string
  language: string
  translation: string
}

export interface Field extends BaseItem {
  collection: string
  field: string
  special: string[] | null
  interface: string | null
  options: Record<string, any> | null
  display: string | null
  display_options: Record<string, any> | null
  readonly: boolean
  hidden: boolean
  sort: number | null
  width: string | null
  translations: FieldTranslation[] | null
  required: boolean
  group: string | null
  validation: Record<string, any> | null
  conditions: Record<string, any> | null
}

export interface FieldTranslation {
  id: number
  field: string
  language: string
  translation: string
}

export interface Relation extends BaseItem {
  many_collection: string
  many_field: string
  one_collection: string
  one_field: string | null
  junction_field: string | null
  sort_field: string | null
}

export type Schema = {
  collections: Collection[]
  fields: Field[]
  relations: Relation[]
  sites: Sites
  globals: Globals
  navigation: Navigation
  pages: Pages
  posts: Posts
  forms: Forms
  help_articles: HelpArticles
  help_collections: HelpCollections
  help_feedback: HelpFeedback
  categories: Categories
  form_submissions: any
  projects: any
}

export type DirectusClient = BaseDirectusClient<Schema>
