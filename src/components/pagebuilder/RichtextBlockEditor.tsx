import React from 'react'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Icon } from '@iconify/react'

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
          Headline <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={currentTranslation?.headline || ''}
          onChange={(e) => updateTranslation('headline', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter headline..."
          required
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
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Alignment
        </label>
        <div className="flex gap-2 w-full">
          {[
            { value: 'left', label: 'Left', icon: 'lucide:align-left' },
            { value: 'center', label: 'Center', icon: 'lucide:align-center' }
          ].map((option) => {
            const isSelected = (formData.alignment || 'center') === option.value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  updateField('alignment', option.value);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateField('alignment', option.value);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Icon icon={option.icon} className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
