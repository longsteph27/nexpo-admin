import React, { useState } from 'react'
import { motion } from 'framer-motion'
import HeroInlineEditor from './HeroInlineEditor'
import HeroBlock from '@/components/blocks/HeroBlock'
import RichTextBlock from '@/components/blocks/RichTextBlock'

interface InlineBlockWrapperProps {
  block: {
    id: string
    collection: string
    item: any
  }
  pageId: string
  lang: string
  onBlockUpdate?: (blockId: string, updatedData: any) => void
}

export default function InlineBlockWrapper({ 
  block, 
  pageId, 
  lang, 
  onBlockUpdate 
}: InlineBlockWrapperProps) {
  const [editMode, setEditMode] = useState(false)

  const handleBlockUpdate = (updatedData: any) => {
    onBlockUpdate?.(block.id, updatedData)
    setEditMode(false)
  }

  const renderBlock = () => {
    switch (block.collection) {
      case 'block_hero':
        if (editMode) {
          return (
            <HeroInlineEditor
              blockId={block.id}
              pageId={pageId}
              data={block.item}
              lang={lang}
              onSave={handleBlockUpdate}
            />
          )
        } else {
          return (
            <HeroBlock
              data={block.item}
              lang={lang}
            />
          )
        }
      
      case 'block_richtext':
        return (
          <RichTextBlock
            data={block.item}
            lang={lang}
          />
        )
      
      default:
        // Fallback to regular block rendering
        return (
          <div className="p-8 text-center text-gray-500">
            <p>Block type "{block.collection}" not supported for inline editing</p>
          </div>
        )
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {renderBlock()}
    </motion.div>
  )
}
