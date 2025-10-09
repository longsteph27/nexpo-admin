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
        // Base styling giữ nguyên
        'rich-text whitespace-pre-line',
        
        // TypographyProse styling từ docs
        'prose prose-sm max-w-none md:prose-base lg:prose-lg',
        'prose-headings:font-serif',
        'prose-p:text-[var(--color-gray)] prose-h1:text-[var(--color-gray)] prose-h2:text-[var(--color-gray)] prose-h3:text-[var(--color-gray)]',
        'prose-h4:text-[var(--color-gray)] prose-h5:text-[var(--color-gray)] prose-h6:text-[var(--color-gray)]',
        'prose-li:text-[var(--color-gray)] prose-li:marker:text-[var(--color-gray)]',
        'prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline',
        'prose-img:rounded-br-3xl prose-img:rounded-tl-3xl prose-img:border-2 prose-img:border-accent',
        
        // Your existing custom element styling (giữ nguyên structure)
        '[&_p]:mb-4 [&_p]:min-h-[1em]',
        '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-8',
        '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6', 
        '[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4',
        '[&_ol]:list-decimal [&_ol]:mb-4 [&_ol]:pl-6',
        '[&_ul]:list-disc [&_ul]:mb-4 [&_ul]:pl-6',
        '[&_li]:mb-1',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4',
        '[&_p:empty]:min-h-[1em] [&_p:empty]:block',
        className
      )}
      style={{ whiteSpace: 'pre-line' }}
      dangerouslySetInnerHTML={{ __html: content ? content : '' }}
    />
  )
}

export default Prose
