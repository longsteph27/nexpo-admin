'use client'
import { motion } from 'framer-motion'
import BlockContainer from '@/components/BlockContainer'
import { Icon } from '@iconify/react'

interface Quote {
  id: string
  title?: string
  subtitle?: string
  content?: string
  tenant_id?: number
  event_id?: number
  translations?: Array<{
    title?: string
    subtitle?: string
    content?: string
    languages_code: string
  }>
}

interface QuoteBlockProps {
  data: Quote
  lang: string
}

export default function QuoteBlock({ data, lang }: QuoteBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  const translations = Array.isArray(data.translations) ? data.translations : []
  const translation = translations.find(t => t.languages_code === directusLang) || translations[0]
  const title = translation?.title || data.title || ''
  const subtitle = translation?.subtitle || data.subtitle || ''
  const content = translation?.content || data.content || ''

  // Debug logging
  console.log('[QuoteBlock] Rendering:', { 
    data, 
    lang, 
    directusLang, 
    translations, 
    translation, 
    title, 
    subtitle, 
    content 
  })

  // Show placeholder if no content
  if (!content) {
    return (
      <BlockContainer className="py-16 px-4">
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl p-8 md:p-12 shadow-lg border-l-8 border-purple-500 border-2 border-dashed">
            <div className="text-center text-content-tertiary">
              <Icon icon="lucide:quote" className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <p className="text-sm">Quote content will appear here</p>
              <p className="text-xs mt-2">Add content in the editor to see the quote</p>
            </div>
          </div>
        </div>
      </BlockContainer>
    )
  }

  return (
    <BlockContainer className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative max-w-4xl mx-auto"
      >
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl p-8 md:p-12 shadow-lg border-l-8 border-purple-500 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/30 rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Quote content */}
          <div className="relative z-10">
            <div className="flex items-start space-x-4 mb-6">
              <span className="text-6xl font-bold text-purple-600 leading-none select-none -mt-2 font-serif">"</span>
              <div
                className="italic text-xl md:text-2xl text-gray-700 leading-relaxed font-medium prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
            
            {/* Author attribution */}
            {(title || subtitle) && (
              <div className="mt-8 pl-16 border-l-4 border-purple-300 pl-8">
                {title && (
                  <div className="text-lg font-semibold text-gray-800 mb-1">
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div className="text-base text-purple-600 font-medium">
                    {subtitle}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </BlockContainer>
  )
}
