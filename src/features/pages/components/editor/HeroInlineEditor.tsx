import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { siteApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import TransparentInput from '@/components/ui/TransparentInput'

interface HeroInlineEditorProps {
  blockId: string
  pageId: string
  data: {
    headline?: string
    content?: string
    image?: string
    image_position?: 'left' | 'right'
    translations?: Array<{
      languages_code: string
      headline?: string
      content?: string
    }>
  }
  lang: string
  onSave?: (updatedData: any) => void
}

export default function HeroInlineEditor({ 
  blockId, 
  pageId, 
  data, 
  lang, 
  onSave 
}: HeroInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    headline: '',
    content: '',
    image: '',
    image_position: 'right' as 'left' | 'right'
  })
  const [isSaving, setIsSaving] = useState(false)
  const { selectedTenant } = useAuth()
  const queryClient = useQueryClient()

  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  const translations = Array.isArray(data.translations) ? data.translations : []
  const translation = translations.find((t: any) => t.languages_code === directusLang) || translations[0]

  // Initialize form data
  useEffect(() => {
    setFormData({
      headline: translation?.headline || data.headline || '',
      content: translation?.content || data.content || '',
      image: data.image || '',
      image_position: data.image_position || 'right'
    })
  }, [data, translation])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update the block with new data
      const updatedData = {
        ...data,
        headline: formData.headline,
        content: formData.content,
        image: formData.image,
        image_position: formData.image_position,
        translations: translations.map((t: any) => 
          t.languages_code === directusLang 
            ? { ...t, headline: formData.headline, content: formData.content }
            : t
        )
      }

      // Call API to update block
      await pagesApi.upsertPageBlock({
        id: blockId,
        pages_id: pageId,
        collection: 'hero',
        item: updatedData,
      })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['page-detail', pageId] })
      
      // Call onSave callback
      onSave?.(updatedData)
      
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save block:', error)
      toast.error('Failed to save changes', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      headline: translation?.headline || data.headline || '',
      content: translation?.content || data.content || '',
      image: data.image || '',
      image_position: data.image_position || 'right'
    })
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
  }

  const contentSection = (
    <div className='md:col-span-2 md:pt-12 transition-all duration-700 ease-out relative'>
      {/* Headline */}
      <div className="relative group">
        {/* Always show the text element */}
        <h1
          className="text-primary text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-font-display font-bold leading-tight mb-4"
          dangerouslySetInnerHTML={{ __html: formData.headline || '' }}
        />
        
        {/* Overlay input when editing */}
        {isEditing && (
          <div className="absolute inset-0">
            <TransparentInput
              value={formData.headline}
              onChange={(value) => setFormData(prev => ({ ...prev, headline: value }))}
              onKeyDown={handleKeyDown}
              placeholder="Enter headline..."
              autoFocus
              className="w-full h-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold"
              style={{
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: 'inherit',
                fontWeight: 'bold',
                lineHeight: 'inherit'
              }}
            />
          </div>
        )}
        
        {/* Placeholder when no content */}
        {!formData.headline && !isEditing && (
          <div className="h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-content-tertiary text-sm">Click edit to add headline</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative group">
        {/* Always show the text element */}
        <p className="w-full py-4 font-font-body text-sm sm:text-base md:text-lg leading-relaxed text-gray">
          {formData.content || ''}
        </p>
        
        {/* Overlay textarea when editing */}
        {isEditing && (
          <div className="absolute inset-0">
            <TransparentInput
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              onKeyDown={handleKeyDown}
              placeholder="Enter content..."
              multiline
              rows={3}
              className="w-full h-full text-sm sm:text-base md:text-lg"
              style={{
                color: 'var(--color-gray)',
                fontFamily: 'var(--font-body)',
                fontSize: 'inherit',
                lineHeight: 'inherit'
              }}
            />
          </div>
        )}
        
        {/* Placeholder when no content */}
        {!formData.content && !isEditing && (
          <div className="h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-content-tertiary text-sm">Click edit to add content</span>
          </div>
        )}
      </div>
    </div>
  )

  const imageSection = (
    <div className='p-4 flex items-center justify-center'>
      {formData.image ? (
        isEditing ? (
          <div className="relative group">
            <img
              className='w-full h-auto max-h-[500px] object-contain rounded-lg border-2 border-dashed border-blue-300'
              src={formData.image.startsWith('http') ? formData.image : `https://app.nexpo.vn/assets/${formData.image}`}
              alt=''
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newImage = prompt('Enter image URL or ID:')
                    if (newImage) {
                      setFormData(prev => ({ ...prev, image: newImage }))
                    }
                  }}
                  className="bg-white/90 text-content-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                  className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <img
            className='w-full h-auto max-h-[500px] object-contain'
            src={formData.image.startsWith('http') ? formData.image : `https://app.nexpo.vn/assets/${formData.image}`}
            alt=''
          />
        )
      ) : (
        isEditing ? (
          <div 
            className="w-full h-64 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => {
              const newImage = prompt('Enter image URL or ID:')
              if (newImage) {
                setFormData(prev => ({ ...prev, image: newImage }))
              }
            }}
          >
            <Icon icon="lucide:image-plus" className="w-12 h-12 text-blue-400 mb-2" />
            <p className="text-blue-600 font-medium">Click to add image</p>
            <p className="text-blue-500 text-sm">Enter URL or ID</p>
          </div>
        ) : (
          <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
            <Icon icon="lucide:image" className="w-12 h-12 text-content-tertiary mb-2" />
            <p className="text-content-tertiary font-medium">No image</p>
            <p className="text-content-tertiary text-sm">Click edit to add image</p>
          </div>
        )
      )}
    </div>
  )

  return (
    <div className="relative group">
      {/* Edit Mode Controls */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-10 flex gap-2"
        >
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            <Icon icon="lucide:check" className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
            Cancel
          </button>
        </motion.div>
      )}

      {/* Edit Button (visible on hover when not editing) */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
        >
          <Icon icon="lucide:edit" className="w-4 h-4" />
          Edit
        </button>
      )}

      {/* Hero Content */}
      <div className='relative grid gap-6 md:grid-cols-3'>
        {formData.image_position === 'left' ? (
          <>
            {imageSection}
            {contentSection}
          </>
        ) : (
          <>
            {contentSection}
            {imageSection}
          </>
        )}
      </div>

      {/* Position Toggle (only in edit mode) */}
      {isEditing && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <label className="text-xs font-medium text-content-primary mb-1 block">Image Position</label>
            <select
              value={formData.image_position}
              onChange={(e) => setFormData(prev => ({ ...prev, image_position: e.target.value as 'left' | 'right' }))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
