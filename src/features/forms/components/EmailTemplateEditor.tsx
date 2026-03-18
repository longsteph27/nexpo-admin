'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button-base';
import { Icon } from '@iconify/react';
import type { FormField, FormFieldTranslation } from '../types';

const TEXT_FIELD_TYPES_EXCLUDE = ['file', 'image', 'upload'];

const VOID_ELEMENTS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

function formatHtml(html: string): string {
  const TAB = '  ';
  let indent = 0;
  let result = '';

  // Normalize: collapse whitespace between tags, then split into tokens
  const tokens = html
    .replace(/>\s+</g, '><')
    .replace(/(<[^>]+>)/g, '\n$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      // Text node
      result += TAB.repeat(indent) + token + '\n';
      continue;
    }

    const isClosing = token.startsWith('</');
    const isSelfClosing = token.endsWith('/>');
    const tagMatch = token.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    const tagName = tagMatch?.[1]?.toLowerCase() ?? '';
    const isVoid = VOID_ELEMENTS.has(tagName);
    const isDoctype = token.toLowerCase().startsWith('<!');

    if (isClosing) {
      indent = Math.max(0, indent - 1);
      result += TAB.repeat(indent) + token + '\n';
    } else if (isDoctype || isSelfClosing || isVoid) {
      result += TAB.repeat(indent) + token + '\n';
    } else {
      result += TAB.repeat(indent) + token + '\n';
      indent++;
    }
  }

  return result.trimEnd();
}

const FIELD_ICON: Record<string, string> = {
  email: 'lucide:mail',
  phone: 'lucide:phone',
  number: 'lucide:hash',
  select: 'lucide:chevrons-up-down',
  textarea: 'lucide:align-left',
};

interface EmailTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  formFields: FormField[];
  className?: string;
  eventName?: string;
}

export default function EmailTemplateEditor({
  value,
  onChange,
  formFields,
  className = '',
  eventName = '',
}: EmailTemplateEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);
  const [rawHtml, setRawHtml] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Generate state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<'bilingual' | 'vi' | 'en'>('bilingual');
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  const [aiLoading, setAiLoading] = useState(false);

  const textFields = formFields.filter(
    (f) => !TEXT_FIELD_TYPES_EXCLUDE.includes(f.type ?? '')
  );

  const getFieldLabel = (field: FormField): string => {
    const translations = field.translations ?? [];
    const translation = translations.find((t) => t.languages_code === 'en-US') as FormFieldTranslation | undefined;
    if (translation && translation.label) return translation.label;
    return field.name || field.id;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFieldDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setIsMounted(true); }, []);

  // Keep rawHtml in sync with value (for HTML mode)
  useEffect(() => {
    setRawHtml(value);
  }, [value]);

  // Convert template format to display format (${fieldId} → {Label})
  const convertFromTemplate = (template: string) => {
    return template.replace(/\$\{([^}]+)\}/g, (_match, fieldId) => {
      const field = formFields.find(f => f.id === fieldId);
      const label = field ? getFieldLabel(field) : fieldId;
      return `{${label}}`;
    });
  };

  // Convert display format back (${fieldId})
  const convertToTemplate = (html: string) => {
    let result = html.replace(
      /<span[^>]*data-field-id="([^"]*)"[^>]*class="form-field-tag"[^>]*>(.*?)<\/span>/g,
      (_match, fieldId) => `\${${fieldId}}`
    );
    result = result.replace(/\{([^}]+)\}/g, (match, fieldName) => {
      const field = formFields.find(f => getFieldLabel(f) === fieldName);
      return field ? `\${${field.id}}` : match;
    });
    return result;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start typing your email template...' }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (mode === 'visual') {
        onChange(convertToTemplate(editor.getHTML()));
      }
    },
    immediatelyRender: false,
  });

  const setTextAlign = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    editor.chain().focus().setTextAlign(align).run();
  };

  const insertFormField = useCallback((field: FormField) => {
    if (!editor) return;
    editor.commands.insertContent(`{${getFieldLabel(field)}}`);
    setFieldDropdownOpen(false);
  }, [editor, formFields]);

  // Insert field tag at cursor in HTML textarea — include label as comment so user can read it
  const insertFieldInHtml = useCallback((field: FormField) => {
    const label = getFieldLabel(field);
    const tag = `\${${field.id}}<!-- ${label} -->`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = rawHtml.slice(0, start) + tag + rawHtml.slice(end);
      setRawHtml(next);
      onChange(next);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      const next = rawHtml + tag;
      setRawHtml(next);
      onChange(next);
    }
    setFieldDropdownOpen(false);
  }, [rawHtml, onChange]);

  const generateWithAI = useCallback(async () => {
    setAiLoading(true);
    try {
      const resp = await fetch('/api/ai/email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName || 'Event',
          language: aiLanguage,
          tone: aiTone,
          is_registration: true,
          fields: textFields.map(f => ({
            id: f.id,
            label: getFieldLabel(f),
            type: f.type ?? 'input',
          })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Generation failed');
      const html = data.html as string;
      setRawHtml(html);
      onChange(html);
      setMode('html');
      setAiPanelOpen(false);
    } catch (err: any) {
      alert(`AI generation failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [eventName, aiLanguage, aiTone, textFields, onChange]);

  // Track previous value to detect when template actually changes (vs mode toggle)
  const prevValueRef = useRef('');

  // Sync editor content when value changes (visual mode)
  useEffect(() => {
    if (!editor) return;

    const valueChanged = value !== prevValueRef.current;
    prevValueRef.current = value;

    if (mode === 'visual') {
      // Auto-switch to HTML mode when a complex template is loaded for the first time.
      // Only fires when value changes (initial load / new template), NOT when user
      // manually toggles mode — so Visual/HTML/Format/Add Labels buttons keep working.
      if (valueChanged) {
        const isComplexHtml =
          value.includes('<table') ||
          value.includes('background-image:') ||
          value.includes('cid:qrcode');
        if (isComplexHtml) {
          setMode('html');
          return;
        }
      }
      const current = convertToTemplate(editor.getHTML());
      if (value !== current) {
        editor.commands.setContent(convertFromTemplate(value));
      }
    }
  }, [value, editor, mode]);

  // Switch mode
  const switchMode = (next: 'visual' | 'html') => {
    if (next === mode) return;
    if (next === 'html') {
      // Take current editor content as raw html
      if (editor) {
        const html = convertToTemplate(editor.getHTML());
        setRawHtml(html);
      }
    } else {
      // Going back to visual — load raw html into editor
      if (editor) {
        editor.commands.setContent(convertFromTemplate(rawHtml));
      }
    }
    setMode(next);
  };

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

  if (!editor) return null;

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* AI Generate Panel */}
      {aiPanelOpen && (
        <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Icon icon="lucide:sparkles" className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-800">Generate with AI</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Language:</span>
            {(['bilingual', 'vi', 'en'] as const).map(l => (
              <button key={l} type="button"
                onClick={() => setAiLanguage(l)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  aiLanguage === l ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-400'
                }`}>
                {l === 'bilingual' ? 'Bilingual' : l === 'vi' ? 'Tiếng Việt' : 'English'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Tone:</span>
            {(['professional', 'friendly', 'formal'] as const).map(t => (
              <button key={t} type="button"
                onClick={() => setAiTone(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  aiTone === t ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-400'
                }`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={() => setAiPanelOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button type="button" onClick={generateWithAI} disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition-colors">
              {aiLoading ? (
                <><Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />Generating...</>
              ) : (
                <><Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />Generate</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 flex items-center gap-2 flex-wrap">

        {/* Mode Toggle */}
        <div className="flex items-center rounded-md border border-gray-300 overflow-hidden mr-2">
          <button
            type="button"
            onClick={() => switchMode('visual')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
              mode === 'visual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon icon="lucide:pen-line" className="w-3.5 h-3.5" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => switchMode('html')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors border-l border-gray-300 ${
              mode === 'html' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon icon="lucide:code-2" className="w-3.5 h-3.5" />
            HTML
          </button>
        </div>

        {mode === 'visual' && (
          <>
            {/* Rich Text Formatting */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-2 py-1 h-7 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`} title="Bold">
                <Icon icon="lucide:bold" className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-2 py-1 h-7 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`} title="Italic">
                <Icon icon="lucide:italic" className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`px-2 py-1 h-7 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`} title="Strikethrough">
                <Icon icon="lucide:strikethrough" className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-2 py-1 h-7 text-xs ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}>H1</Button>
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2 py-1 h-7 text-xs ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}>H2</Button>
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-2 py-1 h-7 text-xs ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}>H3</Button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-2 py-1 h-7 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}>
                <Icon icon="lucide:list" className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-2 py-1 h-7 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}>
                <Icon icon="lucide:list-ordered" className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
              <Button variant="outline" size="sm" onClick={() => setTextAlign('left')}
                className={`px-2 py-1 h-7 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}>
                <Icon icon="lucide:align-left" className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTextAlign('center')}
                className={`px-2 py-1 h-7 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}>
                <Icon icon="lucide:align-center" className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTextAlign('right')}
                className={`px-2 py-1 h-7 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}>
                <Icon icon="lucide:align-right" className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* AI Generate button */}
        <button
          type="button"
          onClick={() => setAiPanelOpen(v => !v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            aiPanelOpen
              ? 'border-purple-400 bg-purple-100 text-purple-700'
              : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
          Generate
        </button>

        {/* Format button — HTML mode only */}
        {mode === 'html' && (
          <button
            type="button"
            onClick={() => {
              const pretty = formatHtml(rawHtml);
              setRawHtml(pretty);
              onChange(pretty);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            title="Beautify HTML"
          >
            <Icon icon="lucide:wand-2" className="w-3.5 h-3.5" />
            Format
          </button>
        )}

        {/* Insert Field Dropdown — available in both modes */}
        {textFields.length > 0 && (
          <div className="relative ml-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setFieldDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Icon icon="lucide:variable" className="w-3.5 h-3.5" />
              Insert Field
              <Icon icon="lucide:chevron-down" className={`w-3 h-3 transition-transform ${fieldDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {fieldDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1">
                {textFields.map((field) => {
                  const label = getFieldLabel(field);
                  const icon = FIELD_ICON[field.type ?? ''] ?? 'lucide:file-text';
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => mode === 'visual' ? insertFormField(field) : insertFieldInHtml(field)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors"
                    >
                      <Icon icon={icon} className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Editor */}
      {mode === 'visual' && (
        <div className="p-4">
          <EditorContent
            editor={editor}
            className="min-h-[200px] focus:outline-none prose prose-sm max-w-none"
          />
        </div>
      )}

      {/* HTML Editor */}
      {mode === 'html' && (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="lucide:info" className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-700">
              Chỉnh sửa HTML trực tiếp. Dùng <code className="bg-amber-100 px-1 rounded font-mono">{'${fieldId}'}</code> để nhúng field — hoặc nhấn "Insert Field" để chọn.
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={rawHtml}
            onChange={(e) => {
              setRawHtml(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full h-80 px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 text-gray-800 leading-relaxed"
            spellCheck={false}
            placeholder="Paste your HTML email template here..."
          />
        </div>
      )}

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
        .ProseMirror p { margin: 0 0 12px 0; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          font-weight: 600; color: rgb(17 24 39); margin: 16px 0 8px 0;
        }
        .ProseMirror h1:first-child, .ProseMirror h2:first-child, .ProseMirror h3:first-child { margin-top: 0; }
        .ProseMirror strong { font-weight: 600; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror ul, .ProseMirror ol { margin: 12px 0; padding-left: 24px; }
        .ProseMirror li { margin: 4px 0; }
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0;
          font-style: italic; color: rgb(75 85 99);
        }
        .ProseMirror [style*="text-align: left"] { text-align: left !important; }
        .ProseMirror [style*="text-align: center"] { text-align: center !important; }
        .ProseMirror [style*="text-align: right"] { text-align: right !important; }
        .ProseMirror code {
          background-color: rgb(243 244 246); padding: 2px 6px; border-radius: 4px;
          font-size: 13px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        .ProseMirror pre {
          background-color: rgb(243 244 246); padding: 12px; border-radius: 6px;
          margin: 12px 0; overflow-x: auto;
        }
        .ProseMirror pre code { background-color: transparent; padding: 0; font-size: 13px; }
        .form-field-tag {
          background: #e3f2fd !important; color: #1976d2 !important;
          padding: 2px 6px !important; border-radius: 4px !important;
          font-size: 0.9em !important; font-weight: 500 !important;
          border: 1px solid #bbdefb !important; display: inline-block !important; margin: 0 2px !important;
        }
        .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: left;
          color: rgb(156 163 175); pointer-events: none; height: 0;
        }
      `}</style>
    </div>
  );
}
