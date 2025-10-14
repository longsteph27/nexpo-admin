'use client'
import { useRouter } from '@/lib/navigation'
import React, { useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

interface ProseProps {
  content: string | null | undefined
  className?: string
}

function Prose({ content, className }: ProseProps) {
  const contentEl = useRef<HTMLDivElement | null>(null)

  const router = useRouter()
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  useEffect(() => {
    if (!contentEl.current) return

    // Intercept all the local links
    const anchors = contentEl.current.getElementsByTagName('a')

    Array.from(anchors).forEach((anchor) => {
      const url = anchor.getAttribute('href')
      if (!url) return

      // Skip external links
      if (!url.startsWith(siteUrl) && !url.startsWith('/')) return
      const path = url.replace(siteUrl, '')

      // Add onClick event to anchor
      anchor.addEventListener('click', (e) => {
        e.preventDefault()
        router.push(url)
      })
    })
  }, [router, siteUrl])

  return (
    <div
      ref={contentEl}
      className={twMerge(
        'prose prose-sm max-w-none md:prose-base lg:prose-lg prose-headings:font-serif prose-p:[--font-display:var(--font-display) ] prose-p:text-gray prose-h1:text-gray prose-h2:text-gray prose-h3:text-gray prose-h4:text-gray prose-h5:text-gray prose-h6:text-gray prose-li:text-gray prose-li:marker:text-gray prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-br-3xl prose-img:rounded-tl-3xl prose-img:border-2 prose-img:border-accent',
        className
      )}
      style={{ whiteSpace: 'pre-line' }}
      dangerouslySetInnerHTML={{ __html: content ? content : '' }}
    />
  )
}

export default Prose
