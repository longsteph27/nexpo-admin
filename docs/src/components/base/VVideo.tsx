import React from 'react'
import { generateVideoEmbed } from '@/lib/utils/embed'

interface VideoProps {
  url: string
  title?: string
  name?: string
  className?: string
}

export default function VVideo({ url, title, name, className }: VideoProps) {
  return (
    <div
      className={`mx-auto my-6 max-w-4xl w-full rounded-2xl bg-white shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${className || ''}`}
    >
      <iframe
        className='aspect-video w-full min-h-[400px]'
        id={name}
        loading='lazy'
        src={generateVideoEmbed(url)}
        frameBorder='0'
        allow='autoplay; fullscreen; picture-in-picture'
        allowFullScreen
        title={title}
        style={{ borderRadius: '1rem' }}
      ></iframe>
    </div>
  )
}
