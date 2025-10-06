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
        'prose prose-sm max-w-none md:prose-base lg:prose-lg prose-headings:font-serif prose-p:[--font-display:var(--font-display) ] prose-p:text-[var(--color-gray)] prose-h1:text-[var(--color-gray)] prose-h2:text-[var(--color-gray)] prose-h3:text-[var(--color-gray)] prose-h4:text-[var(--color-gray)] prose-h5:text-[var(--color-gray)] prose-h6:text-[var(--color-gray)] prose-li:text-[var(--color-gray)] prose-li:marker:text-[var(--color-gray)] prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline prose-img:rounded-br-3xl prose-img:rounded-tl-3xl prose-img:border-2 prose-img:border-accent',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content ? content : '' }}
    />
  )
}

export default Prose
