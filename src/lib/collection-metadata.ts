import { CollectionName, CollectionInfo } from '@/types/collections';

// Collection metadata based on schema-events.json
export const COLLECTION_METADATA: Record<CollectionName, CollectionInfo> = {
  // Block collections (HIDDEN from dashboard - managed within events)
  'block_button_group': {
    name: 'block_button_group',
    displayName: 'Button Groups',
    icon: 'mdi:button-cursor',
    color: '#3B82F6',
    description: 'Button group blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_button': {
    name: 'block_button',
    displayName: 'Buttons',
    icon: 'mdi:button-cursor',
    color: '#3B82F6',
    description: 'Button blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_columns_rows': {
    name: 'block_columns_rows',
    displayName: 'Column Rows',
    icon: 'mdi:view-column',
    color: '#8B5CF6',
    description: 'Column row blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_columns': {
    name: 'block_columns',
    displayName: 'Columns',
    icon: 'mdi:view-column',
    color: '#8B5CF6',
    description: 'Column blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_cta': {
    name: 'block_cta',
    displayName: 'Call to Action',
    icon: 'mdi:bullhorn',
    color: '#F59E0B',
    description: 'Call to action blocks',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_divider': {
    name: 'block_divider',
    displayName: 'Dividers',
    icon: 'mdi:minus',
    color: '#6B7280',
    description: 'Divider blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_faqs': {
    name: 'block_faqs',
    displayName: 'FAQs',
    icon: 'mdi:help-circle',
    color: '#10B981',
    description: 'FAQ blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_form': {
    name: 'block_form',
    displayName: 'Forms',
    icon: 'mdi:form-select',
    color: '#EF4444',
    description: 'Form blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_gallery_files': {
    name: 'block_gallery_files',
    displayName: 'Gallery Files',
    icon: 'mdi:image-multiple',
    color: '#EC4899',
    description: 'Gallery file blocks',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_gallery': {
    name: 'block_gallery',
    displayName: 'Galleries',
    icon: 'mdi:image-multiple',
    color: '#EC4899',
    description: 'Gallery blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_hero': {
    name: 'block_hero',
    displayName: 'Hero Sections',
    icon: 'mdi:view-dashboard',
    color: '#F97316',
    description: 'Hero section blocks',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_html': {
    name: 'block_html',
    displayName: 'HTML Blocks',
    icon: 'mdi:code-tags',
    color: '#6366F1',
    description: 'HTML blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_logocloud_logos': {
    name: 'block_logocloud_logos',
    displayName: 'Logo Cloud Logos',
    icon: 'mdi:cloud',
    color: '#06B6D4',
    description: 'Logo cloud logo blocks',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_logocloud': {
    name: 'block_logocloud',
    displayName: 'Logo Clouds',
    icon: 'mdi:cloud',
    color: '#06B6D4',
    description: 'Logo cloud blocks',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_quote': {
    name: 'block_quote',
    displayName: 'Quotes',
    icon: 'mdi:format-quote-close',
    color: '#84CC16',
    description: 'Quote blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_richtext': {
    name: 'block_richtext',
    displayName: 'Rich Text',
    icon: 'mdi:format-text',
    color: '#8B5CF6',
    description: 'Rich text blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_step_items': {
    name: 'block_step_items',
    displayName: 'Step Items',
    icon: 'mdi:step-forward',
    color: '#F59E0B',
    description: 'Step item blocks',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_steps': {
    name: 'block_steps',
    displayName: 'Steps',
    icon: 'mdi:step-forward',
    color: '#F59E0B',
    description: 'Step blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_team': {
    name: 'block_team',
    displayName: 'Team Blocks',
    icon: 'mdi:account-group',
    color: '#10B981',
    description: 'Team blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_testimonial_slider_items': {
    name: 'block_testimonial_slider_items',
    displayName: 'Testimonial Slider Items',
    icon: 'mdi:comment-quote',
    color: '#EC4899',
    description: 'Testimonial slider item blocks',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_testimonials': {
    name: 'block_testimonials',
    displayName: 'Testimonials',
    icon: 'mdi:comment-quote',
    color: '#EC4899',
    description: 'Testimonial blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'block_video': {
    name: 'block_video',
    displayName: 'Videos',
    icon: 'mdi:video',
    color: '#EF4444',
    description: 'Video blocks for page builder',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },
  'blocks': {
    name: 'blocks',
    displayName: 'Blocks',
    icon: 'mdi:view-grid',
    color: '#6B7280',
    description: 'General blocks collection',
    isSingleton: false,
    hasArchive: false,
    group: 'blocks'
  },

  // Content collections
  'categories': {
    name: 'categories',
    displayName: 'Categories',
    icon: 'mdi:tag',
    color: '#10B981',
    description: 'Content categories',
    isSingleton: false,
    hasArchive: true,
    group: 'content'
  },
  'events': {
    name: 'events',
    displayName: 'Events',
    icon: 'mdi:calendar-event',
    color: '#FF5722',
    description: 'Tenant-specific events',
    isSingleton: false,
    hasArchive: true,
    group: 'content'
  },
  'posts': {
    name: 'posts',
    displayName: 'Posts',
    icon: 'mdi:article',
    color: '#1A212C',
    description: 'Simple blog posts',
    isSingleton: false,
    hasArchive: true,
    group: 'content'
  },
  'testimonials': {
    name: 'testimonials',
    displayName: 'Testimonials',
    icon: 'mdi:comment-quote',
    color: '#EC4899',
    description: 'Customer testimonials',
    isSingleton: false,
    hasArchive: true,
    group: 'content'
  },
  'team': {
    name: 'team',
    displayName: 'Team',
    icon: 'mdi:account-group',
    color: '#10B981',
    description: 'Team members',
    isSingleton: false,
    hasArchive: true,
    group: 'content'
  },

  // Page collections
  'pages': {
    name: 'pages',
    displayName: 'Pages',
    icon: 'mdi:web_asset',
    color: '#1A212C',
    description: 'Many-to-Any page builder pages',
    isSingleton: false,
    hasArchive: true,
    group: 'pages'
  },
  'pages_blog': {
    name: 'pages_blog',
    displayName: 'Blog Pages',
    icon: 'mdi:signpost',
    color: '#18222F',
    description: 'Blog page configuration',
    isSingleton: true,
    hasArchive: false,
    group: 'pages'
  },
  'pages_projects': {
    name: 'pages_projects',
    displayName: 'Project Pages',
    icon: 'mdi:folder-open',
    color: '#1A212C',
    description: 'Project pages',
    isSingleton: false,
    hasArchive: true,
    group: 'pages'
  },
  'page_blocks': {
    name: 'page_blocks',
    displayName: 'Page Blocks',
    icon: 'mdi:view-grid',
    color: '#6B7280',
    description: 'Blocks used in pages',
    isSingleton: false,
    hasArchive: false,
    group: 'pages'
  },
  'post_gallery_items': {
    name: 'post_gallery_items',
    displayName: 'Post Gallery Items',
    icon: 'mdi:image-multiple',
    color: '#EC4899',
    description: 'Gallery items for posts',
    isSingleton: false,
    hasArchive: false,
    group: 'pages'
  },

  // Form collections
  'forms': {
    name: 'forms',
    displayName: 'Forms',
    icon: 'mdi:form-select',
    color: '#EF4444',
    description: 'Form definitions',
    isSingleton: false,
    hasArchive: true,
    group: 'forms'
  },
  'form_fields': {
    name: 'form_fields',
    displayName: 'Form Fields',
    icon: 'mdi:form-select',
    color: '#EF4444',
    description: 'Form field definitions',
    isSingleton: false,
    hasArchive: false,
    group: 'forms'
  },
  'form_submissions': {
    name: 'form_submissions',
    displayName: 'Form Submissions',
    icon: 'mdi:file-document',
    color: '#6B7280',
    description: 'Submitted form data',
    isSingleton: false,
    hasArchive: true,
    group: 'forms'
  },
  'form_answers': {
    name: 'form_answers',
    displayName: 'Form Answers',
    icon: 'mdi:comment-text',
    color: '#6B7280',
    description: 'Individual form answers',
    isSingleton: false,
    hasArchive: false,
    group: 'forms'
  },

  // Navigation collections
  'navigation': {
    name: 'navigation',
    displayName: 'Navigation',
    icon: 'mdi:navigation',
    color: '#3B82F6',
    description: 'Site navigation menus',
    isSingleton: false,
    hasArchive: true,
    group: 'navigation'
  },
  'navigation_items': {
    name: 'navigation_items',
    displayName: 'Navigation Items',
    icon: 'mdi:navigation',
    color: '#3B82F6',
    description: 'Navigation menu items',
    isSingleton: false,
    hasArchive: false,
    group: 'navigation'
  },

  // System collections
  'globals': {
    name: 'globals',
    displayName: 'Globals',
    icon: 'mdi:earth',
    color: '#8B5CF6',
    description: 'Global site settings',
    isSingleton: false,
    hasArchive: false,
    group: 'system'
  },
  'seo': {
    name: 'seo',
    displayName: 'SEO',
    icon: 'mdi:search-web',
    color: '#10B981',
    description: 'SEO settings',
    isSingleton: false,
    hasArchive: false,
    group: 'system'
  },
  'redirects': {
    name: 'redirects',
    displayName: 'Redirects',
    icon: 'mdi:arrow-right',
    color: '#F59E0B',
    description: 'URL redirects',
    isSingleton: false,
    hasArchive: false,
    group: 'system'
  },
  'sites': {
    name: 'sites',
    displayName: 'Sites',
    icon: 'mdi:web',
    color: '#6B7280',
    description: 'Site configurations',
    isSingleton: false,
    hasArchive: true,
    group: 'system'
  }
};

export function getCollectionInfo(collection: CollectionName): CollectionInfo {
  return COLLECTION_METADATA[collection] || {
    name: collection,
    displayName: collection.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: 'mdi:database',
    color: '#6B7280',
    description: `Collection: ${collection}`,
    isSingleton: false,
    hasArchive: false
  };
}

export function getCollectionsByGroup(group: string): CollectionName[] {
  return Object.entries(COLLECTION_METADATA)
    .filter(([_, info]) => info.group === group)
    .map(([name, _]) => name as CollectionName);
}

export function getAllGroups(): string[] {
  const groups = new Set(Object.values(COLLECTION_METADATA).map(info => info.group).filter(Boolean));
  return Array.from(groups);
}
