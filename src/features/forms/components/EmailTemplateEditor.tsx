'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button-base';
import { Icon } from '@iconify/react';
import type { FormField, FormFieldTranslation } from '../types';

interface EmailTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  formFields: FormField[];
  className?: string;
}

export default function EmailTemplateEditor({
  value,
  onChange,
  formFields,
  className = ''
}: EmailTemplateEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Helper function to get field label safely
  const getFieldLabel = (field: FormField): string => {
    const translations = field.translations ?? [];
    const translation = translations.find((t) => t.languages_code === 'en-US') as FormFieldTranslation | undefined;
    if (translation && translation.label) {
      return translation.label;
    }
    return field.name || field.id;
  };

  // Handle SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Convert template format to HTML for editing
  const convertFromTemplate = (template: string) => {
    return template.replace(
      /\$\{([^}]+)\}/g,
      (match, fieldId) => {
        const field = formFields.find(f => f.id === fieldId);
        const label = field ? getFieldLabel(field) : fieldId;
        return `{${label}}`;
      }
    );
  };

  // Convert HTML back to template format for saving
  const convertToTemplate = (html: string) => {
    // First convert HTML spans back to field IDs
    let result = html.replace(
      /<span[^>]*data-field-id="([^"]*)"[^>]*class="form-field-tag"[^>]*>(.*?)<\/span>/g,
      (match, fieldId) => {
        return `\${${fieldId}}`;
      }
    );
    
    // Then convert {fieldName} back to ${fieldId} format
    result = result.replace(
      /\{([^}]+)\}/g,
      (match, fieldName) => {
        const field = formFields.find(f => getFieldLabel(f) === fieldName);
        return field ? `\${${field.id}}` : match;
      }
    );
    
    return result;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your email template...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const template = convertToTemplate(html);
      onChange(template);
    },
    immediatelyRender: false,
  });

  // Text alignment functions
  const setTextAlign = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    editor.chain().focus().setTextAlign(align).run();
  };

  // Insert form field function
  const insertFormField = useCallback((field: FormField) => {
    if (!editor) return;
    
    const fieldLabel = getFieldLabel(field);
    const fieldText = `{${fieldLabel}}`;
    
    editor.commands.insertContent(fieldText);
  }, [editor, formFields]);

  // Update editor content when value changes
  useEffect(() => {
    if (editor && value !== convertToTemplate(editor.getHTML())) {
      const htmlContent = convertFromTemplate(value);
      editor.commands.setContent(htmlContent);
    }
  }, [value, editor]);

  if (!isMounted) {
    return (
      <div className={`border border-gray-300 rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">Loading editor...</span>
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Rich Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-2 py-1 h-8 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
              title="Bold"
            >
              <Icon icon="lucide:bold" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 h-8 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
              title="Italic"
            >
              <Icon icon="lucide:italic" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-2 py-1 h-8 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
              title="Strikethrough"
            >
              <Icon icon="lucide:strikethrough" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`px-2 py-1 h-8 ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
              title="Code"
            >
              <Icon icon="lucide:code" className="w-4 h-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-2 py-1 h-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
              title="Heading 1"
            >
              H1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2 py-1 h-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
              title="Heading 2"
            >
              H2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-2 py-1 h-8 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
              title="Heading 3"
            >
              H3
            </Button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-2 py-1 h-8 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
              title="Bullet List"
            >
              <Icon icon="lucide:list" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-2 py-1 h-8 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
              title="Numbered List"
            >
              <Icon icon="lucide:list-ordered" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`px-2 py-1 h-8 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
              title="Quote"
            >
              <Icon icon="lucide:quote" className="w-4 h-4" />
            </Button>
          </div>

          {/* Text Alignment */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTextAlign('left')}
              className={`px-2 py-1 h-8 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
              title="Align Left"
            >
              <Icon icon="lucide:align-left" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTextAlign('center')}
              className={`px-2 py-1 h-8 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
              title="Align Center"
            >
              <Icon icon="lucide:align-center" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTextAlign('right')}
              className={`px-2 py-1 h-8 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
              title="Align Right"
            >
              <Icon icon="lucide:align-right" className="w-4 h-4" />
            </Button>
          </div>

          {/* Form Fields */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-600 mr-2">Fields:</span>
            {formFields.slice(0, 5).map((field) => (
              <Button
                key={field.id}
                variant="outline"
                size="sm"
                onClick={() => insertFormField(field)}
                className="text-xs px-2 py-1 h-8 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                title={`Insert ${getFieldLabel(field)} field`}
              >
                <Icon 
                  icon={
                    field.type === 'email' ? 'lucide:mail' :
                    field.type === 'phone' ? 'lucide:phone' :
                    field.type === 'number' ? 'lucide:hash' :
                    'lucide:file-text'
                  } 
                  className="w-3 h-3 mr-1" 
                />
                {getFieldLabel(field)}
              </Button>
            ))}
            {formFields.length > 5 && (
              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-8 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  +{formFields.length - 5} more
                </Button>
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {formFields.slice(5).map((field) => (
                      <Button
                        key={field.id}
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormField(field)}
                        className="text-xs px-2 py-1 h-7 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        title={`Insert ${getFieldLabel(field)} field`}
                      >
                        <Icon 
                          icon={
                            field.type === 'email' ? 'lucide:mail' :
                            field.type === 'phone' ? 'lucide:phone' :
                            field.type === 'number' ? 'lucide:hash' :
                            'lucide:file-text'
                          } 
                          className="w-3 h-3 mr-1" 
                        />
                        {getFieldLabel(field)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent 
          editor={editor}
          className="min-h-[200px] focus:outline-none prose prose-sm max-w-none"
        />
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 200px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.6;
          color: rgb(55 65 81);
        }
        
        .ProseMirror:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .ProseMirror p {
          margin: 0 0 12px 0;
        }
        
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          font-weight: 600;
          color: rgb(17 24 39);
          margin: 16px 0 8px 0;
        }
        
        .ProseMirror h1:first-child, .ProseMirror h2:first-child, .ProseMirror h3:first-child {
          margin-top: 0;
        }
        
        .ProseMirror strong {
          font-weight: 600;
        }
        
        .ProseMirror em {
          font-style: italic;
        }
        
        .ProseMirror ul, .ProseMirror ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        
        .ProseMirror li {
          margin: 4px 0;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: rgb(75 85 99);
        }
        
        /* Text Alignment */
        .ProseMirror [style*="text-align: left"] {
          text-align: left !important;
        }
        
        .ProseMirror [style*="text-align: center"] {
          text-align: center !important;
        }
        
        .ProseMirror [style*="text-align: right"] {
          text-align: right !important;
        }
        
        .ProseMirror [style*="text-align: justify"] {
          text-align: justify !important;
        }
        
        .ProseMirror code {
          background-color: rgb(243 244 246);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .ProseMirror pre {
          background-color: rgb(243 244 246);
          padding: 12px;
          border-radius: 6px;
          margin: 12px 0;
          overflow-x: auto;
        }
        
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          font-size: 13px;
        }
        
        .form-field-tag {
          background: #e3f2fd !important;
          color: #1976d2 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 0.9em !important;
          font-weight: 500 !important;
          border: 1px solid #bbdefb !important;
          display: inline-block !important;
          margin: 0 2px !important;
        }
        
        /* Style for field names in curly braces */
        .ProseMirror {
          font-family: inherit;
        }
        
        .ProseMirror:has-text("{") {
          position: relative;
        }
        
        .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(156 163 175);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}