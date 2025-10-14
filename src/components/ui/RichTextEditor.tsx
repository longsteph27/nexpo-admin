'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Icon } from '@iconify/react';
import { ImageUploadDialog } from './ImageUploadDialog';
import { VideoUploadDialog } from './VideoUploadDialog';
import { LinkInputDialog } from './LinkInputDialog';
import { useAuthStore } from '@/store/auth';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // All useState hooks first
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    content: string;
  }>({ show: false, content: '' });
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogMode, setLinkDialogMode] = useState<'add' | 'edit'>('add');
  const [linkDialogInitialUrl, setLinkDialogInitialUrl] = useState('');
  const [linkDialogInitialText, setLinkDialogInitialText] = useState('');
  const [paragraphDropdownOpen, setParagraphDropdownOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  
  // Get selected tenant for media folder
  const selectedTenant = useAuthStore((state) => state.selectedTenant);
  const folderId = (selectedTenant as any)?.folder_files_id;

  // All useRef hooks
  const editorRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();

  // useEditor hook - Must be defined before useCallback hooks that depend on it - Headless mode
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default UI elements for headless mode
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 transition-colors',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow',
        },
        inline: false,
        allowBase64: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      updateTooltip(); // Update tooltip on content change
    },
    onSelectionUpdate: ({ editor }) => {
      updateTooltip(); // Update tooltip on selection change
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-6 text-content-primary leading-relaxed font-sans',
        'data-testid': 'rich-text-editor',
      },
    },
    immediatelyRender: false,
    // Headless configuration
    editable: true,
    injectCSS: false, // Disable default TipTap CSS
  });

  // All useCallback hooks - defined after editor
  const setLink = useCallback(() => {
    if (!editor) return;

    // Check if link is already active
    const isActive = editor.isActive('link');
    
    if (isActive) {
      // Edit mode: Get current link attributes
      const { href } = editor.getAttributes('link');
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, '');
      
      setLinkDialogMode('edit');
      setLinkDialogInitialUrl(href || '');
      setLinkDialogInitialText(text);
      setLinkDialogOpen(true);
    } else {
      // Add mode: Get selected text
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, '');
      
      setLinkDialogMode('add');
      setLinkDialogInitialText(text);
      setLinkDialogInitialUrl('');
      setLinkDialogOpen(true);
    }
  }, [editor]);

  const handleLinkAdded = useCallback((url: string, text?: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const currentText = editor.state.doc.textBetween(from, to, '');

    if (linkDialogMode === 'edit') {
      // Edit existing link
      if (text && text !== currentText) {
        // Replace text and update link
        editor.chain().focus().deleteSelection().insertContent({
          type: 'text',
          text: text,
          marks: [{ type: 'link', attrs: { href: url } }]
        }).run();
      } else {
        // Just update the URL
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    } else {
      // Add new link
      if (text && text !== currentText) {
        // Insert with custom text
        editor.chain().focus().deleteSelection().insertContent({
          type: 'text',
          text: text,
          marks: [{ type: 'link', attrs: { href: url } }]
        }).run();
      } else {
        // Just add link to selection
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  }, [editor, linkDialogMode]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const handleImageSelected = useCallback((imageUrl: string) => {
    editor?.chain().focus().setImage({ src: imageUrl }).run();
  }, [editor]);

  const handleVideoSelected = useCallback((videoUrl: string) => {
    if (!editor) return;
    
    // Insert video HTML with proper styling and multiple source formats
    const videoHtml = `
      <div class="video-container">
        <video controls class="w-full h-auto rounded-lg shadow-md" preload="metadata">
          <source src="${videoUrl}" type="video/mp4">
          <source src="${videoUrl}" type="video/webm">
          <source src="${videoUrl}" type="video/ogg">
          <p>Your browser does not support the video tag. <a href="${videoUrl}" target="_blank">Download video</a></p>
        </video>
      </div>
    `;
    
    editor.chain().focus().insertContent(videoHtml).run();
  }, [editor]);


  const updateTooltip = useCallback(() => {
    if (!editor) return;

    // Clear existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Debounce tooltip update
    tooltipTimeoutRef.current = setTimeout(() => {
      const formats: string[] = [];
      
      if (editor.isActive('bold')) formats.push('Bold');
      if (editor.isActive('italic')) formats.push('Italic');
      if (editor.isActive('underline')) formats.push('Underline');
      if (editor.isActive('strike')) formats.push('Strikethrough');
      
      const headingLevel = editor.getAttributes('heading')?.level;
      if (headingLevel) formats.push(`H${headingLevel}`);
      
      const textAlign = editor.getAttributes('textAlign')?.textAlign;
      if (textAlign && textAlign !== 'left') formats.push(`${textAlign} aligned`);
      
      if (editor.isActive('bulletList')) formats.push('Bullet List');
      if (editor.isActive('orderedList')) formats.push('Numbered List');
      if (editor.isActive('blockquote')) formats.push('Quote');
      if (editor.isActive('code')) formats.push('Code');
      
      const link = editor.getAttributes('link')?.href;
      if (link) formats.push(`Link: ${link}`);

      if (formats.length > 0) {
        setTooltip({
          show: true,
          content: formats.join(', ')
        });
      } else {
        // Only hide tooltip if it was showing, don't flicker
        setTooltip(prev => prev.show ? { show: false, content: '' } : prev);
      }
    }, 100); // 100ms debounce
  }, [editor]);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    // Smooth hide with slight delay to prevent flickering
    setTimeout(() => {
      setTooltip({ show: false, content: '' });
    }, 50);
  }, []);

  // All useEffect hooks
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  React.useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Close paragraph dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paragraphDropdownOpen && editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setParagraphDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [paragraphDropdownOpen]);

  // Editor functions - defined after hooks
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => 
    editor?.chain().focus().setTextAlign(align).run();
  const setHeading = (level: 1 | 2 | 3) => 
    editor?.chain().focus().toggleHeading({ level }).run();
  
  const convertToPrimaryButton = () => {
    if (!editor) return;
    
    // Check if current selection is a link
    if (editor.isActive('link')) {
      const { href } = editor.getAttributes('link');
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, '');
      
      // Apply button classes to the existing link (from customFormats schema)
      editor.chain().focus().updateAttributes('link', {
        class: 'btn_live btn_live-primary btn_live-md',
        target: '_self'
      }).run();
    }
    setParagraphDropdownOpen(false);
  };

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden relative">
        <div className="p-6 text-center text-content-tertiary">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={editorRef}
      className="border border-gray-200 rounded-lg overflow-hidden relative"
      onMouseLeave={handleMouseLeave}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 flex flex-wrap gap-1">
        {/* Text formatting */}
        <button
          type="button"
          onClick={toggleBold}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'text-content-secondary'}`}
          title="Bold"
        >
          <Icon icon="lucide:bold" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleItalic}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'text-content-secondary'}`}
          title="Italic"
        >
          <Icon icon="lucide:italic" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleUnderline}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'text-content-secondary'}`}
          title="Underline"
        >
          <Icon icon="lucide:underline" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleStrike}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'text-content-secondary'}`}
          title="Strikethrough"
        >
          <Icon icon="lucide:strikethrough" className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => setHeading(1)}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('heading', { level: 1 }) ? 'bg-green-100 text-green-600 border border-green-200' : 'text-content-secondary'}`}
          title="Heading 1"
        >
          <Icon icon="lucide:heading-1" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setHeading(2)}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('heading', { level: 2 }) ? 'bg-green-100 text-green-600 border border-green-200' : 'text-content-secondary'}`}
          title="Heading 2"
        >
          <Icon icon="lucide:heading-2" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setHeading(3)}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('heading', { level: 3 }) ? 'bg-green-100 text-green-600 border border-green-200' : 'text-content-secondary'}`}
          title="Heading 3"
        >
          <Icon icon="lucide:heading-3" className="w-4 h-4" />
        </button>

        {/* Paragraph Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setParagraphDropdownOpen(!paragraphDropdownOpen)}
            className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 text-content-secondary flex items-center gap-1`}
            title="Paragraph Options"
          >
            <span className="text-sm font-medium">Paragraph</span>
            <Icon icon="lucide:chevron-down" className="w-3 h-3" />
          </button>
          
          {paragraphDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
              <button
                type="button"
                onClick={convertToPrimaryButton}
                disabled={!editor?.isActive('link')}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  editor?.isActive('link') 
                    ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium' 
                    : 'text-content-tertiary cursor-not-allowed opacity-50'
                }`}
              >
                Primary Button
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={toggleBulletList}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('bulletList') ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'text-content-secondary'}`}
          title="Bullet List"
        >
          <Icon icon="lucide:list" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={toggleOrderedList}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('orderedList') ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'text-content-secondary'}`}
          title="Numbered List"
        >
          <Icon icon="lucide:list-ordered" className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleBlockquote}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('blockquote') ? 'bg-green-100 text-green-600 border border-green-200' : 'text-content-secondary'}`}
          title="Quote"
        >
          <Icon icon="lucide:quote" className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => setTextAlign('left')}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive({ textAlign: 'left' }) ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'text-content-secondary'}`}
          title="Align Left"
        >
          <Icon icon="lucide:align-left" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setTextAlign('center')}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive({ textAlign: 'center' }) ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'text-content-secondary'}`}
          title="Align Center"
        >
          <Icon icon="lucide:align-center" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setTextAlign('right')}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive({ textAlign: 'right' }) ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'text-content-secondary'}`}
          title="Align Right"
        >
          <Icon icon="lucide:align-right" className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link and Media */}
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'text-content-secondary'}`}
          title="Add Link"
        >
          <Icon icon="lucide:link" className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => setImageDialogOpen(true)}
          className="p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 text-content-secondary"
          title="Add Image"
        >
          <Icon icon="lucide:image" className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => setVideoDialogOpen(true)}
          className="p-2 rounded transition-all duration-200 hover:bg-gray-200 hover:scale-105 text-content-secondary"
          title="Add Video"
        >
          <Icon icon="lucide:video" className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="min-h-[120px]">
        <EditorContent 
          editor={editor} 
          placeholder={placeholder}
        />
      </div>
      
      {/* Custom CSS for proper heading styles - Match image exactly */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .ProseMirror {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            line-height: 1.6 !important;
            color: #333333 !important;
          }
          
          .ProseMirror h1 {
            font-size: 2.25rem !important;        /* 36px - Large như ảnh */
            font-weight: 700 !important;          /* Bold */
            line-height: 1.2 !important;          /* Tight spacing */
            margin: 1.5rem 0 0.75rem 0 !important; /* More space above, less below */
            color: #111827 !important;            /* Dark gray */
            letter-spacing: -0.025em !important;  /* Tighter letter spacing */
          }
          
          .ProseMirror h2 {
            font-size: 1.875rem !important;       /* 30px - Medium-large */
            font-weight: 600 !important;          /* Semi-bold */
            line-height: 1.3 !important;
            margin: 1.25rem 0 0.5rem 0 !important;
            color: #111827 !important;
            letter-spacing: -0.025em !important;
          }
          
          .ProseMirror h3 {
            font-size: 1.5rem !important;         /* 24px - Medium */
            font-weight: 600 !important;          /* Semi-bold */
            line-height: 1.4 !important;
            margin: 1rem 0 0.5rem 0 !important;
            color: #111827 !important;
            letter-spacing: -0.025em !important;
          }
          
          .ProseMirror p {
            margin: 0.75rem 0 0.75rem 0 !important; /* Equal spacing */
            line-height: 1.6 !important;
            color: #333333 !important;            /* Slightly darker than before */
            font-size: 1rem !important;           /* 16px base */
          }
          
          .ProseMirror ul, .ProseMirror ol {
            margin: 0.75rem 0 !important;
            padding-left: 2rem !important;        /* More indentation like image */
          }
          
          .ProseMirror li {
            margin: 0.25rem 0 !important;
            line-height: 1.5 !important;
            color: #333333 !important;
          }
          
          .ProseMirror ol li {
            list-style-type: decimal !important;
          }
          
          .ProseMirror ul li {
            list-style-type: disc !important;
          }
          
          // .ProseMirror a {
          //   color: #2563eb !important;            /* Blue links */
          //   text-decoration: underline !important;
          //   cursor: pointer !important;
          // }
          
          // .ProseMirror a:hover {
          //   color: #1d4ed8 !important;            /* Darker blue on hover */
          // }
          
          .ProseMirror strong {
            font-weight: 700 !important;          /* Bolder than before */
            color: #111827 !important;
          }
          
          .ProseMirror em {
            font-style: italic !important;
          }
          
          .ProseMirror u {
            text-decoration: underline !important;
          }
          
          .ProseMirror s {
            text-decoration: line-through !important;
          }
          
          .ProseMirror blockquote {
            border-left: 4px solid #10b981 !important;
            padding-left: 1.5rem !important;
            margin: 1.5rem 0 !important;
            font-style: italic !important;
            color: #374151 !important;
            background-color: #f0fdf4 !important;
            padding: 1rem 1.5rem !important;
            border-radius: 0 0.5rem 0.5rem 0 !important;
            position: relative !important;
          }
          
          .ProseMirror blockquote::before {
            content: '"' !important;
            font-size: 3rem !important;
            color: #10b981 !important;
            position: absolute !important;
            left: 0.5rem !important;
            top: -0.5rem !important;
            font-family: serif !important;
            line-height: 1 !important;
          }
          
          .ProseMirror blockquote p {
            margin: 0 !important;
            color: #374151 !important;
          }
          
          /* Button-like text styling */
          .ProseMirror .button-text {
            color: #2563eb !important;
            text-decoration: underline !important;
            cursor: pointer !important;
            font-weight: 500 !important;
          }
          
          // /* Primary Button styling */
          // .ProseMirror a.btn {
          //   display: inline-block !important;
          //   padding: 0.5rem 1rem !important;
          //   border-radius: 0.5rem !important;
          //   font-weight: 500 !important;
          //   text-decoration: none !important;
          //   transition: all 0.2s ease-in-out !important;
          //   border: 2px solid transparent !important;
          //   cursor: pointer !important;
          // }
          
          // .ProseMirror a.btn.btn-primary {
          //   background-color: #3B82F6 !important;
          //   color: white !important;
          //   border-color: #3B82F6 !important;
          // }
          
          // .ProseMirror a.btn.btn-primary:hover {
          //   background-color: #2563EB !important;
          //   border-color: #2563EB !important;
          //   transform: translateY(-1px) !important;
          //   box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
          // }
          
          // .ProseMirror a.btn.btn-md {
          //   padding: 0.5rem 1rem !important;
          //   font-size: 0.875rem !important;
          // }
          
          /* Ensure proper spacing between elements */
          .ProseMirror > * + * {
            margin-top: 0.75rem !important;
          }
          
          .ProseMirror h1 + p,
          .ProseMirror h2 + p,
          .ProseMirror h3 + p {
            margin-top: 0.5rem !important;
          }
          
          /* Image styling - Match reference image layout */
          .ProseMirror img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 1.5rem auto !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            transition: all 0.2s ease-in-out !important;
          }
          
          .ProseMirror img:hover {
            transform: scale(1.02) !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
          
          /* Full-width images for banners */
          .ProseMirror img[data-full-width="true"] {
            width: 100% !important;
            margin: 2rem 0 !important;
            border-radius: 0 !important;
          }
          
          /* Image with text overlay support */
          .ProseMirror .image-container {
            position: relative !important;
            display: block !important;
            margin: 1.5rem auto !important;
            border-radius: 0.5rem !important;
            overflow: hidden !important;
          }
          
          .ProseMirror .image-overlay {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.7)) !important;
            color: white !important;
            padding: 2rem 1.5rem 1.5rem !important;
          }
          
          .ProseMirror .image-overlay h2 {
            font-size: 2rem !important;
            font-weight: 700 !important;
            margin: 0 0 0.5rem 0 !important;
            color: white !important;
          }
          
          .ProseMirror .image-overlay p {
            font-size: 1rem !important;
            margin: 0 !important;
            color: rgba(255, 255, 255, 0.9) !important;
          }
          
          /* Video styling */
          .ProseMirror .video-container {
            margin: 1rem 0 !important;
            display: block !important;
          }
          
          .ProseMirror video {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            transition: box-shadow 0.3s ease !important;
          }
          
          .ProseMirror video:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
        `
      }} />
      
      {/* Tooltip - Fixed position below toolbar */}
      <div className={`absolute top-full left-0 right-0 z-50 transition-all duration-200 ease-in-out ${
        tooltip.show 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}>
        <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-b-lg shadow-lg border-t border-gray-700">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:info" className="w-4 h-4 text-blue-400" />
            <span>{tooltip.content}</span>
          </div>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onImageSelected={handleImageSelected}
        folderId={folderId}
      />

      {/* Link Input Dialog */}
      <LinkInputDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onLinkAdded={handleLinkAdded}
        initialUrl={linkDialogInitialUrl}
        initialText={linkDialogInitialText}
        mode={linkDialogMode}
      />

      {/* Video Upload Dialog */}
      <VideoUploadDialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        onVideoSelected={handleVideoSelected}
        folderId={folderId}
      />
    </div>
  );
}
