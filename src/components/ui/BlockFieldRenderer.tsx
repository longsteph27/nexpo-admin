'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Icon } from '@iconify/react';
import { assetsApi, siteApi } from '@/lib/api';
import { RichTextEditor } from './RichTextEditor';

interface FieldRendererProps {
  field: {
    field: string;
    type: string;
    meta: {
      interface: string;
      options?: Record<string, unknown>;
      required?: boolean;
      note?: string;
      fields?: Array<{
        field: string;
        type: string;
        interface: string;
        note?: string;
      }>;
      relatedCollection?: string;
      allowCreate?: boolean;
      allowDelete?: boolean;
      hidden?: boolean;
    };
  };
  value: unknown;
  onChange: (value: unknown) => void;
  language?: string;
}

interface TranslationFieldProps {
  translationFields: Array<{
    field: string;
    type: string;
    interface: string;
    note?: string;
  }>;
  value: Record<string, Record<string, unknown>>;
  onChange: (value: Record<string, Record<string, unknown>>) => void;
  note?: string;
}

// Translation Field Component with Language Switch
function TranslationField({ translationFields, value, onChange, note }: TranslationFieldProps) {
  const [currentLanguage, setCurrentLanguage] = useState<'en-US' | 'vi-VN'>('en-US');

  const updateTranslation = (fieldName: string, fieldValue: unknown) => {
    const newValue = {
      ...value,
      [currentLanguage]: {
        ...(value?.[currentLanguage] || {}),
        [fieldName]: fieldValue
      }
    };
    onChange(newValue);
  };

  const getCurrentValue = (fieldName: string) => {
    return value?.[currentLanguage]?.[fieldName] || '';
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500">{note || 'Translations'}</div>
      
      {/* Language Switch */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setCurrentLanguage('en-US')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            currentLanguage === 'en-US'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          🇺🇸 English
        </button>
        <button
          type="button"
          onClick={() => setCurrentLanguage('vi-VN')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            currentLanguage === 'vi-VN'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          🇻🇳 Vietnamese
        </button>
      </div>

      {/* Current Language Fields */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
          {currentLanguage === 'en-US' ? 'English Content' : 'Vietnamese Content'}
        </div>
        {translationFields.map((transField) => (
          <div key={`${currentLanguage}-${transField.field}`} className="space-y-1">
            <label className="text-xs text-gray-600">{transField.note || transField.field}</label>
            {transField.interface === 'input-rich-text-html' ? (
              <RichTextEditor
                value={getCurrentValue(transField.field)}
                onChange={(htmlValue) => updateTranslation(transField.field, htmlValue)}
                placeholder={`${transField.note || transField.field} (${currentLanguage})`}
              />
            ) : (
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={getCurrentValue(transField.field)}
                onChange={(e) => updateTranslation(transField.field, e.target.value)}
                placeholder={`${transField.note || transField.field} (${currentLanguage})`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlockFieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const [uploading, setUploading] = useState(false);
  const [relatedItems, setRelatedItems] = useState<Record<string, unknown>[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      setUploading(true);
      try {
        const result = await assetsApi.upload(acceptedFiles[0]);
        if (result.success && result.data?.id) {
          onChange(result.data.id);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
    },
  });

  // Load related items for M2O fields
  React.useEffect(() => {
    const { meta } = field;
    if (meta.relatedCollection && meta.interface === 'select-dropdown-m2o') {
      setLoadingRelated(true);
      siteApi.getRelatedItems(meta.relatedCollection, meta.options?.template)
        .then(response => {
          if (response.success) {
            setRelatedItems(response.data || []);
          } else {
            console.error('Failed to load related items:', response.error);
            setRelatedItems([]);
          }
        })
        .catch(error => {
          console.error('Error loading related items:', error);
          setRelatedItems([]);
        })
        .finally(() => {
          setLoadingRelated(false);
        });
    }
  }, [field]);

  const handleCreateRelated = async (collectionName: string) => {
    // For now, just log - in a real implementation, this would open a modal
    console.log(`Create new ${collectionName}`);
    // TODO: Implement modal for creating related items
  };

  const handleDeleteRelated = async (itemId: string, collectionName: string) => {
    if (confirm(`Are you sure you want to delete this ${collectionName}?`)) {
      const response = await siteApi.deleteRelatedItem(collectionName, itemId);
      if (response.success) {
        // Refresh the related items list
        const { meta } = field;
        if (meta.relatedCollection) {
          const refreshResponse = await siteApi.getRelatedItems(meta.relatedCollection, meta.options?.template);
          if (refreshResponse.success) {
            setRelatedItems(refreshResponse.data || []);
          }
        }
        // Clear the current selection
        onChange('');
      } else {
        console.error('Failed to delete item:', response.error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  const renderField = () => {
    const { field: fieldName, type, meta } = field;
    const { interface: interfaceType, options, note, relatedCollection, allowCreate, allowDelete, hidden } = meta;

    // Skip hidden fields
    if (hidden) {
      return null;
    }

    // Handle translations interface
    if (interfaceType === 'translations') {
      const translationFields = meta.fields || [];
      return (
        <TranslationField
          translationFields={translationFields}
          value={value}
          onChange={onChange}
          note={note || fieldName}
        />
      );
    }

    // Handle file upload (uuid type with file interface)
    if (type === 'uuid' && interfaceType === 'file') {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : value ? (
              <div className="space-y-2">
                <Icon icon="lucide:check-circle" className="w-6 h-6 text-green-500 mx-auto" />
                <div className="text-sm text-gray-600">File uploaded</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Icon icon="lucide:upload" className="w-6 h-6 text-gray-400 mx-auto" />
                <div className="text-sm text-gray-600">
                  {isDragActive ? 'Drop file here' : 'Click or drag file here'}
                </div>
                <div className="text-xs text-gray-500">Images, videos, PDFs</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Handle M2O (Many-to-One) relationship
    if (interfaceType === 'select-dropdown-m2o' && relatedCollection) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <div className="space-y-2">
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={loadingRelated}
            >
              <option value="">Select {relatedCollection}...</option>
              {relatedItems.map((item: Record<string, unknown>) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {options?.template ? 
                    String(options.template).replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => String(item[key] || '')) :
                    String(item.name || item.title || item.id)
                  }
                </option>
              ))}
            </select>
            
            {/* Action buttons for related collection */}
            <div className="flex items-center space-x-2">
              {allowCreate && (
                <button
                  type="button"
                  onClick={() => handleCreateRelated(relatedCollection)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <Icon icon="lucide:plus" className="w-3 h-3" />
                  <span>Create New</span>
                </button>
              )}
              
              {value && allowDelete && (
                <button
                  type="button"
                  onClick={() => handleDeleteRelated(value, relatedCollection)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Icon icon="lucide:trash-2" className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Handle select radio
    if (interfaceType === 'select-radio' && options?.choices) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <div className="space-y-2">
            {(options.choices as Array<{value: string; text: string}>).map((choice) => (
              <label key={choice.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={fieldName}
                  value={choice.value}
                  checked={value === choice.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">{choice.text}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    // Handle select/dropdown
    if (interfaceType === 'select-dropdown' || interfaceType === 'select-multiple-dropdown') {
      const choices = options?.choices || [];
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            multiple={interfaceType === 'select-multiple-dropdown'}
          >
            <option value="">Select {fieldName}</option>
            {choices.map((choice: {value: string; text: string}) => (
              <option key={choice.value} value={choice.value}>
                {choice.text}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Handle boolean/toggle
    if (type === 'boolean' || interfaceType === 'boolean') {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={fieldName}
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded"
            />
            <label htmlFor={fieldName} className="text-xs text-gray-600">
              {note || fieldName}
            </label>
          </div>
        </div>
      );
    }

    // Handle rich text editor
    if (interfaceType === 'input-rich-text-html') {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <RichTextEditor
            value={value || ''}
            onChange={onChange}
            placeholder={note || fieldName}
          />
        </div>
      );
    }

    // Handle textarea
    if (interfaceType === 'textarea' || type === 'text') {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <textarea
            className="w-full border rounded px-2 py-1 text-sm"
            rows={3}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={note || fieldName}
          />
        </div>
      );
    }

    // Handle slider
    if (interfaceType === 'slider') {
      const { min = 0, max = 100, step = 1 } = options || {};
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <div className="space-y-2">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value || min}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 text-center">{value || min}</div>
          </div>
        </div>
      );
    }

    // Handle number
    if (type === 'integer' || type === 'decimal' || type === 'float') {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{note || fieldName}</div>
          <input
            type="number"
            className="w-full border rounded px-2 py-1 text-sm"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={note || fieldName}
            step={type === 'integer' ? '1' : '0.01'}
          />
        </div>
      );
    }

    // Default text input
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-500">{note || fieldName}</div>
        <input
          type="text"
          className="w-full border rounded px-2 py-1 text-sm"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={note || fieldName}
        />
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {renderField()}
    </div>
  );
}
