'use client'
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import BlockContainer from '@/components/BlockContainer'
import VIcon from '@/components/base/VIcon'
import Image from 'next/image'
import { getDirectusMedia } from '@/lib/utils/directus-helpers'
import VBadge from '@/components/base/VBadge'

interface GalleryProps {
  items: Array<{
    id?: string
    title?: string
    description?: string
    tags?: string[]
  }>
}

function VGallery({ items }: GalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentItemIdx, setCurrentItemIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [themeColor, setThemeColor] = useState('')

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const color = getComputedStyle(containerRef.current).getPropertyValue('--color-primary')
      if (color) setThemeColor(color.trim())
    }
  }, [isOpen])

  const currentItem = useMemo(() => {
    return items[currentItemIdx]
  }, [items, currentItemIdx])

  const next = useCallback(() => {
    setCurrentItemIdx((prevIdx) =>
      prevIdx === items.length - 1 ? 0 : prevIdx + 1
    )
  }, [items.length])

  const prev = useCallback(() => {
    setCurrentItemIdx((prevIdx) =>
      prevIdx === 0 ? items.length - 1 : prevIdx - 1
    )
  }, [items.length])

  const toggle = useCallback(() => {
    setIsOpen((open) => !open)
  }, [])

  const onKeydown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'Escape') {
      toggle()
    }
    if (e.key === 'ArrowRight') {
      next()
    }
    if (e.key === 'ArrowLeft') {
      prev()
    }
  }, [isOpen, toggle, next, prev])

  useEffect(() => {
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [onKeydown])

  return (
    <>
      <BlockContainer>
        {/* Gallery */}
        <div ref={containerRef} className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item, itemIdx) => (
            <button
              key={itemIdx}
              onClick={() => {
                setCurrentItemIdx(itemIdx)
                toggle()
              }}
              className="group relative block w-full overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-200 hover:scale-105 transition-transform duration-300 ease-in-out"
              style={{ aspectRatio: '4/3' }}
              data-gallery-card
            >
              <style jsx>{`
                [data-gallery-card] .gallery-thumb-img {
                  transition: transform 400ms var(--gallery-scale-timing, cubic-bezier(0.4, 0, 0.2, 1));
                }
                [data-gallery-card]:hover .gallery-thumb-img {
                  transform: scale(1.08);
                }
                [data-gallery-card] .gallery-thumb-overlay {
                  opacity: 0;
                  transition: opacity 200ms ease;
                }
                [data-gallery-card]:hover .gallery-thumb-overlay {
                  opacity: 1;
                }
              `}</style>

              <Image
                src={getDirectusMedia(item.id)}
                width={800}
                height={600}
                alt={item.title || ''}
                className="gallery-thumb-img w-full h-full object-cover"
              />
              {/* Overlay & Icon - only applied to hovered image */}
              <div className="gallery-thumb-overlay pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                <VIcon
                  icon="heroicons:magnifying-glass-plus"
                  className="text-white drop-shadow-lg h-12 w-12"
                />
              </div>
            </button>
          ))}
        </div>
      </BlockContainer>
      {/* Gallery Modal */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-fade-in"
          style={{ '--color-primary': themeColor } as React.CSSProperties}
        >
          {/* Tags - theme-aware badge colors */}
          <div className="absolute bottom-4 right-4 z-50 flex flex-wrap gap-2 font-mono text-white">
            {currentItem?.tags?.map((tag, tagIdx) => (
              <VBadge key={tagIdx} size="lg" className="rounded-xl text-white bg-black/60 backdrop-blur">
                {tag}
              </VBadge>
            ))}
          </div>

          <div className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center">
            {/* Close button - theme-aware color */}
            <button
              onClick={toggle}
              className="absolute right-4 top-4 z-50 rounded-xl bg-[var(--color-primary)] p-4 text-2xl text-white shadow-lg transition-all duration-300 hover:bg-opacity-80 hover:scale-110"
            >
              {/* <span className="sr-only">Close</span> */}
              <VIcon icon="heroicons:x-mark" className="h-6 w-6" />
            </button>

            <div className="flex h-full w-full items-center justify-center">
              {/* Navigation buttons - theme-aware */}
              <button
                onClick={prev}
                className="absolute left-4 z-50 rounded-xl bg-[var(--color-primary)] p-4 text-2xl text-white shadow-lg transition-all duration-300 hover:bg-opacity-80 hover:scale-110"
              >
                <span className="sr-only">Previous</span>
                <VIcon icon="heroicons:arrow-left" className="h-6 w-6" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 z-50 rounded-xl bg-[var(--color-primary)] p-4 text-2xl text-white shadow-lg transition-all duration-300 hover:bg-opacity-80 hover:scale-110"
              >
                <span className="sr-only">Next</span>
                <VIcon icon="heroicons:arrow-right" className="h-6 w-6" />
              </button>

              {/* Image + Metadata */}
              <div className="relative flex items-center justify-center w-full h-full">
                <div className="relative w-full h-full flex flex-col items-center justify-center p-8 animate-fade-in">
                  {/* Metadata */}
                  <div className="flex w-full mb-4 items-center gap-2">
                    <p className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2 font-serif font-bold text-white text-lg shadow">
                      <VIcon icon="heroicons:photo" className="w-5 h-5" />
                      {currentItem.title || 'Image'}
                    </p>
                    {currentItem.description && (
                      <p className="hidden flex-1 bg-black/60 px-6 py-2 font-mono text-white md:inline-block rounded-xl">
                        {currentItem.description}
                      </p>
                    )}
                  </div>

                  <Image
                    width={900}
                    height={700}
                    alt={currentItem.title || ''}
                    src={getDirectusMedia(currentItem.id)}
                    className="w-full max-h-[70vh] rounded-3xl object-contain shadow-2xl transition-all duration-500 animate-fade-in"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default VGallery
