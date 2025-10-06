/// <reference types="next" />
/// <reference types="next/image-types/global" />

import { Metadata } from 'next'

/**
 * Base interface for route parameters in our multi-tenant app
 */
export interface RouteParams {
  site: string
  lang: string
  slug?: string[]
}

/**
 * Server-side context for pages and API routes
 */
export interface PageContextServer {
  locale: string
  params: RouteParams
}

/**
 * Props for App Router page components
 * Note: Both params and searchParams are Promises in Next.js's generated types
 */
export type PageProps = {
  params: Promise<RouteParams>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Props for metadata generation functions
 */
export interface GenerateMetadataProps {
  params: Promise<RouteParams>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Props for layout components
 */
export interface LayoutProps {
  children: React.ReactNode
  params: Promise<RouteParams>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Props for template components
 */
export interface TemplateProps {
  children: React.ReactNode
  params: Promise<RouteParams>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
} 