'use client'
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState, useCallback } from 'react'
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item, itemIdx) => (
            <button
              key={itemIdx}
              onClick={() => {
                setCurrentItemIdx(itemIdx)
                toggle()
              }}
              className={`group relative block w-full overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-gray-50 to-gray-200`}
              style={{ aspectRatio: '4/3' }}
            >
              <Image
                src={getDirectusMedia(item.id)}
                width={800}
                height={600}
                alt={item.title || ''}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <VIcon
                  icon="heroicons:magnifying-glass-plus"
                  className="text-white drop-shadow-lg h-12 w-12 animate-pulse vgallery-primary"
                />
              </div>
              {/* {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2 text-white text-lg font-semibold truncate">
                  {item.title}
                </div>
              )} */}
            </button>
          ))}
        </div>
      </BlockContainer>
      {/* Gallery Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-fade-in">
          {/* Tips for using the gallery
          <div className="absolute left-4 top-4 z-50 hidden font-mono text-white md:block">
            <div className="rounded-br-3xl rounded-tl-3xl bg-black/80 p-4 shadow-lg">
              <p>Press 'esc' to close</p>
              <p>Press 'left' or 'right' to navigate</p>
            </div>
          </div> */}
          <div className="absolute bottom-4 right-4 z-50 flex flex-wrap gap-2 font-mono text-white">
            {currentItem &&
              currentItem.tags &&
              currentItem.tags.map((tag, tagIdx) => (
                <VBadge key={tagIdx} size="lg" className="rounded-xl border border-white/20 text-white vgallery-primary">
                  {tag}
                </VBadge>
              ))}
          </div>
          <div className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center">
            <button
              onClick={toggle}
              className="absolute right-4 top-4 z-50 rounded-xl bg-[var(--color-primary)] p-4 text-2xl text-white shadow-lg transition-all duration-300 hover:bg-opacity-80 hover:scale-110 vgallery-primary"
            >
              <span className="sr-only">Close</span>
              <VIcon icon="heroicons:x-mark" className="h-6 w-6" />
            </button>
            <div className="flex h-full w-full items-center justify-center">
              <button
                onClick={prev}
                className="absolute left-4 z-50 rounded-xl bg-[var(--color-primary)] p-4 text-2xl text-white shadow-lg transition-all duration-300 hover:bg-opacity-80 hover:scale-110 vgallery-primary"
              >
                <span className="sr-only">Previous</span>
                <VIcon icon="heroicons:arrow-left" className="h-6 w-6 animate-bounce-left" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 z-50 rounded-xl bg-[var(--color-primary)] p-4 text-2xl text-white shadow-lg transition-all duration-300 hover:bg-opacity-80 hover:scale-110 vgallery-primary"
              >
                <span className="sr-only">Next</span>
                <VIcon icon="heroicons:arrow-right" className="h-6 w-6 animate-bounce-right" />
              </button>
              {/* Image */}
              <div className="relative flex items-center justify-center w-full h-full">
                <div className="relative w-full h-full flex flex-col items-center justify-center p-8 animate-fade-in">
                  {/* Metadata */}
                  <div className="flex w-full mb-4 items-center gap-2">
                    <p className="inline-block rounded-xl bg-[var(--color-primary)] px-6 py-2 font-serif font-bold text-white text-xl shadow">
                      {currentItem.title}
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
        </div>
      )}
    </>
  )
}

export default VGallery
