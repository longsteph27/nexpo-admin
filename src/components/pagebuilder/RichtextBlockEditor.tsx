import React from 'react'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

interface RichtextBlockEditorProps {
  formData: Record<string, unknown>
  updateTranslation: (field: string, value: string) => void
  updateField: (field: string, value: string) => void
  currentTranslation: Record<string, unknown>
  folderId?: string
  eventId?: string
}

export default function RichtextBlockEditor({ 
  formData, 
  updateTranslation, 
  updateField, 
  currentTranslation 
}: RichtextBlockEditorProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (Optional)
        </label>
        <input
          type="text"
          value={currentTranslation?.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter title..."
        />
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Headline
        </label>
        <RichTextEditor
          value={currentTranslation?.headline || ''}
          onChange={(value) => updateTranslation('headline', value)}
          placeholder="Enter headline..."
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <RichTextEditor
          value={currentTranslation?.content || ''}
          onChange={(value) => updateTranslation('content', value)}
          placeholder="Enter content..."
        />
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Alignment
        </label>
        <div className="flex space-x-4">
          {[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="alignment"
                value={option.value}
                checked={formData.alignment === option.value}
                onChange={(e) => updateField('alignment', e.target.value)}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
