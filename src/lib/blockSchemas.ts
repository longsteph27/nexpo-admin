// Block schemas based on schema-blocks.json and schema-translations-relate.json analysis
export const BLOCK_SCHEMAS = {
  block_hero: {
    name: 'Hero',
    icon: 'lucide:image',
    description: 'Large banner section with background image or video',
    color: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Hero content translations',
          fields: [
            { field: 'title', type: 'string', interface: 'input', note: 'Hero title' },
            { field: 'headline', type: 'text', interface: 'input-rich-text-html', note: 'Hero headline (rich text)' },
            { field: 'content', type: 'text', interface: 'input-multiline', note: 'Hero content (multiline text)' }
          ]
        }
      },
      {
        field: 'image',
        type: 'uuid',
        meta: {
          interface: 'file-image',
          required: false,
          note: 'Hero background image'
        }
      },
      {
        field: 'image_position',
        type: 'string',
        meta: {
          interface: 'select-radio',
          options: {
            choices: [
              { text: 'Left', value: 'left' },
              { text: 'Right', value: 'right' }
            ]
          },
          required: false,
          note: 'Image position'
        }
      },
      {
        field: 'button_group',
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{id}}'
          },
          required: false,
          note: 'Button group',
          relatedCollection: 'block_button_group',
          allowCreate: true,
          allowDelete: true
        }
      },
      {
        field: 'tenant_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{name}}'
          },
          required: true,
          note: 'Tenant',
          relatedCollection: 'tenants',
          hidden: true // Auto-filled from context
        }
      },
      {
        field: 'event_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{name}}',
            enableLink: true
          },
          required: true,
          note: 'Event',
          relatedCollection: 'events',
          hidden: true // Auto-filled from context
        }
      }
    ]
  },
  block_richtext: {
    name: 'Rich Text',
    icon: 'lucide:file-text',
    description: 'Formatted text content with headings and styling',
    color: 'bg-gradient-to-br from-green-50 to-emerald-100',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Rich text content translations',
          fields: [
            { field: 'title', type: 'string', interface: 'input', note: 'Section title' },
            { field: 'content', type: 'text', interface: 'input-rich-text-html', note: 'Rich text content' }
          ]
        }
      }
    ]
  },
  block_faqs: {
    name: 'FAQs',
    icon: 'lucide:help-circle',
    description: 'Frequently asked questions with expandable answers',
    color: 'bg-gradient-to-br from-purple-50 to-violet-100',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'FAQ section translations'
        }
      },
      {
        field: 'items',
        type: 'json',
        meta: {
          interface: 'list',
          required: false,
          note: 'FAQ items'
        }
      }
    ]
  },
  block_columns: {
    name: 'Columns',
    icon: 'lucide:columns',
    description: 'Multi-column layout for organizing content',
    color: 'bg-gradient-to-br from-orange-50 to-amber-100',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Columns section translations'
        }
      },
      {
        field: 'columns',
        type: 'integer',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { value: 1, text: '1 Column' },
              { value: 2, text: '2 Columns' },
              { value: 3, text: '3 Columns' },
              { value: 4, text: '4 Columns' }
            ]
          },
          required: false,
          note: 'Number of columns'
        }
      }
    ]
  },
  block_gallery: {
    name: 'Gallery',
    icon: 'lucide:images',
    description: 'Image gallery with lightbox and grid layout',
    color: 'bg-gradient-to-br from-pink-50 to-rose-100',
    borderColor: 'border-pink-200',
    iconColor: 'text-pink-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Gallery section translations'
        }
      },
      {
        field: 'images',
        type: 'json',
        meta: {
          interface: 'list',
          required: false,
          note: 'Gallery images'
        }
      }
    ]
  },
  block_video: {
    name: 'Video',
    icon: 'lucide:play-circle',
    description: 'Video player with custom controls and autoplay',
    color: 'bg-gradient-to-br from-red-50 to-pink-100',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Video section translations'
        }
      },
      {
        field: 'video_file',
        type: 'uuid',
        meta: {
          interface: 'file',
          required: false,
          note: 'Video file'
        }
      },
      {
        field: 'video_url',
        type: 'string',
        meta: {
          interface: 'input',
          required: false,
          note: 'Video URL (YouTube, Vimeo, etc.)'
        }
      }
    ]
  },
  block_cta: {
    name: 'Call to Action',
    icon: 'lucide:megaphone',
    description: 'Prominent call-to-action with buttons and messaging',
    color: 'bg-gradient-to-br from-teal-50 to-cyan-100',
    borderColor: 'border-teal-200',
    iconColor: 'text-teal-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'CTA section translations'
        }
      },
      {
        field: 'background_color',
        type: 'string',
        meta: {
          interface: 'input',
          required: false,
          note: 'Background color (hex)'
        }
      },
      {
        field: 'button_style',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { value: 'primary', text: 'Primary' },
              { value: 'secondary', text: 'Secondary' },
              { value: 'outline', text: 'Outline' }
            ]
          },
          required: false,
          note: 'Button style'
        }
      }
    ]
  },
  block_button_group: {
    name: 'Button Group',
    icon: 'lucide:mouse-pointer-click',
    description: 'Multiple action buttons with consistent styling',
    color: 'bg-gradient-to-br from-indigo-50 to-blue-100',
    borderColor: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Button group translations'
        }
      },
      {
        field: 'buttons',
        type: 'json',
        meta: {
          interface: 'list',
          required: false,
          note: 'Button items'
        }
      }
    ]
  },
  block_testimonials: {
    name: 'Testimonials',
    icon: 'lucide:quote',
    description: 'Customer testimonials with photos and ratings',
    color: 'bg-gradient-to-br from-yellow-50 to-orange-100',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Testimonials section translations'
        }
      },
      {
        field: 'items',
        type: 'json',
        meta: {
          interface: 'list',
          required: false,
          note: 'Testimonial items'
        }
      }
    ]
  },
  block_steps: {
    name: 'Steps',
    icon: 'lucide:list-ordered',
    description: 'Step-by-step process or instructions',
    color: 'bg-gradient-to-br from-emerald-50 to-green-100',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Steps section translations'
        }
      },
      {
        field: 'items',
        type: 'json',
        meta: {
          interface: 'list',
          required: false,
          note: 'Step items'
        }
      }
    ]
  },
  block_quote: {
    name: 'Quote',
    icon: 'lucide:quote',
    description: 'Inspirational quote with author attribution',
    color: 'bg-gradient-to-br from-purple-50 to-indigo-100',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    fields: [
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Quote content translations',
          fields: [
            { field: 'title', type: 'string', interface: 'input', note: 'Quote title/author name' },
            { field: 'subtitle', type: 'string', interface: 'input', note: 'Quote subtitle/author title' },
            { field: 'content', type: 'text', interface: 'input-rich-text-html', note: 'Quote content (rich text)' }
          ]
        }
      },
      {
        field: 'tenant_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{name}}'
          },
          required: true,
          note: 'Tenant',
          relatedCollection: 'tenants',
          allowCreate: false,
          allowDelete: false
        }
      },
      {
        field: 'event_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{name}}',
            enableLink: true
          },
          required: true,
          note: 'Event',
          relatedCollection: 'events',
          allowCreate: false,
          allowDelete: false
        }
      }
    ]
  },
  block_form: {
    name: 'Form',
    icon: 'lucide:form-input',
    description: 'Contact or registration form section',
    color: 'bg-gradient-to-br from-green-50 to-emerald-100',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    fields: [
      {
        field: 'form',
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{translations.title}}'
          },
          display: 'related-values',
          display_options: {
            template: '{{translations.title}}'
          },
          required: false,
          note: 'Select form to display',
          relatedCollection: 'forms',
          allowCreate: false,
          allowDelete: false
        }
      },
      {
        field: 'translations',
        type: 'alias',
        meta: {
          interface: 'translations',
          options: { languageField: 'code' },
          required: false,
          note: 'Form section translations',
          fields: [
            { field: 'title', type: 'string', interface: 'input', note: 'Form section title' },
            { field: 'headline', type: 'string', interface: 'input', note: 'Form section headline/description' }
          ]
        }
      },
      {
        field: 'tenant_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{name}}'
          },
          required: true,
          note: 'Tenant',
          relatedCollection: 'tenants',
          allowCreate: false,
          allowDelete: false
        }
      },
      {
        field: 'event_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{name}}',
            enableLink: true
          },
          required: true,
          note: 'Event',
          relatedCollection: 'events',
          allowCreate: false,
          allowDelete: false
        }
      }
    ]
  }
};

export const BLOCK_COLLECTIONS = Object.keys(BLOCK_SCHEMAS);
