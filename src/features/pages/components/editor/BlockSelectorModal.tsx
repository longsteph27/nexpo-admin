'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlockType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

const BLOCK_TYPES: BlockType[] = [
  // Layout Blocks
  {
    id: 'block_hero',
    name: 'Hero',
    description: 'Large banner with headline, image, and call-to-action',
    icon: 'lucide:layout-dashboard',
    category: 'Layout',
  },
  {
    id: 'block_columns',
    name: 'Columns',
    description: 'Multi-column layout with text and images',
    icon: 'lucide:columns',
    category: 'Layout',
  },
  
  // Content Blocks
  {
    id: 'block_richtext',
    name: 'Rich Text',
    description: 'Formatted text content with styling',
    icon: 'lucide:text',
    category: 'Content',
  },
  {
    id: 'block_quote',
    name: 'Quote',
    description: 'Highlighted quote or testimonial',
    icon: 'lucide:quote',
    category: 'Content',
  },
  {
    id: 'block_html',
    name: 'Custom HTML',
    description: 'Insert custom HTML code',
    icon: 'lucide:code',
    category: 'Content',
  },
  {
    id: 'block_divider',
    name: 'Divider',
    description: 'Visual section separator',
    icon: 'lucide:minus',
    category: 'Content',
  },

  // Media Blocks
  {
    id: 'block_gallery',
    name: 'Gallery',
    description: 'Image gallery with lightbox',
    icon: 'lucide:images',
    category: 'Media',
  },
  {
    id: 'block_video',
    name: 'Video',
    description: 'Embed video from URL or file',
    icon: 'lucide:video',
    category: 'Media',
  },
  {
    id: 'block_logocloud',
    name: 'Logo Cloud',
    description: 'Display company or partner logos',
    icon: 'lucide:cloud',
    category: 'Media',
  },

  // Interactive Blocks
  {
    id: 'block_faqs',
    name: 'FAQs',
    description: 'Frequently asked questions accordion',
    icon: 'lucide:help-circle',
    category: 'Interactive',
  },
  {
    id: 'block_steps',
    name: 'Steps',
    description: 'Step-by-step process guide',
    icon: 'lucide:list-ordered',
    category: 'Interactive',
  },
  {
    id: 'block_form',
    name: 'Form',
    description: 'Contact or registration form',
    icon: 'lucide:form-input',
    category: 'Interactive',
  },

  // People & Social
  {
    id: 'block_team',
    name: 'Team',
    description: 'Team member profiles',
    icon: 'lucide:users',
    category: 'People',
  },
  {
    id: 'block_testimonials',
    name: 'Testimonials',
    description: 'Customer testimonials slider',
    icon: 'lucide:message-circle',
    category: 'People',
  },

  // Action Blocks
  {
    id: 'block_cta',
    name: 'Call to Action',
    description: 'Prominent action button section',
    icon: 'lucide:arrow-right-circle',
    category: 'Action',
  },
];

interface BlockSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (blockType: string) => void;
}

export default function BlockSelectorModal({
  isOpen,
  onClose,
  onSelectBlock,
}: BlockSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(BLOCK_TYPES.map(b => b.category)))];

  const filteredBlocks = BLOCK_TYPES.filter(block => {
    const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         block.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || block.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectBlock = (blockId: string) => {
    onSelectBlock(blockId);
    setSearchTerm('');
    setSelectedCategory('All');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Add Section</h2>
                  <p className="text-sm text-neutral-500">Choose a block type to add to your page</p>
                </div>
                <button
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <Icon icon="lucide:x" className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Search & Filter */}
              <div className="px-6 py-4 border-b border-neutral-200 space-y-3">
                <div className="relative">
                  <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search blocks..."
                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {categories.map(category => (
                    <button
                      key={category}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blocks Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredBlocks.map(block => (
                    <motion.button
                      key={block.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white border-2 border-neutral-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
                      onClick={() => handleSelectBlock(block.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-neutral-100 group-hover:bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon icon={block.icon} className="w-5 h-5 text-neutral-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-neutral-900 mb-1">{block.name}</h3>
                          <p className="text-xs text-neutral-500 line-clamp-2">{block.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {filteredBlocks.length === 0 && (
                  <div className="text-center py-12">
                    <Icon icon="lucide:search-x" className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">No blocks found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

