'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { CollectionName, CollectionInfo } from '@/types/collections';
import ProtectedComponent from '@/components/ProtectedComponent';

interface CollectionFormProps {
  collection: CollectionName;
  collectionInfo: CollectionInfo;
  onSubmit: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function CollectionForm({ collection, collectionInfo, onSubmit, onClose }: CollectionFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Common field types based on collection name
  const getFieldType = (field: string): string => {
    if (field.includes('date') || field.includes('time')) return 'datetime-local';
    if (field.includes('email')) return 'email';
    if (field.includes('url') || field.includes('link')) return 'url';
    if (field.includes('phone')) return 'tel';
    if (field.includes('number') || field.includes('count') || field.includes('sort')) return 'number';
    if (field.includes('description') || field.includes('content') || field.includes('text')) return 'textarea';
    return 'text';
  };

  // Generate form fields based on collection
  const generateFields = () => {
    const commonFields = [
      'title', 'name', 'description', 'content', 'slug', 'status', 'sort',
      'email', 'phone', 'url', 'image', 'date', 'start_date', 'end_date',
      'location', 'address', 'city', 'country', 'price', 'category'
    ];

    return commonFields.map(field => {
      const fieldType = getFieldType(field);
      
      return (
        <div key={field} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 capitalize">
            {field.replace('_', ' ')}
          </label>
          {fieldType === 'textarea' ? (
            <textarea
              value={String(formData[field] || '')}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder={`Enter ${field.replace('_', ' ')}`}
            />
          ) : (
            <input
              type={fieldType}
              value={String(formData[field] || '')}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Enter ${field.replace('_', ' ')}`}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {collectionInfo.icon && (
                <Icon 
                  icon={collectionInfo.icon} 
                  className="w-6 h-6"
                  style={{ color: collectionInfo.color }}
                />
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                Create New {collectionInfo.displayName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600">
                <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generateFields()}
          </div>

          {/* Custom fields based on collection */}
          {collection === 'events' && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="datetime-local"
                    value={String(formData.start_date || '')}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="datetime-local"
                    value={String(formData.end_date || '')}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={String(formData.location || '')}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Event location"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    value={String(formData.price || '')}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Event price"
                  />
                </div>
              </div>
            </div>
          )}

          {collection === 'posts' && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Post Details</h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={String(formData.content || '')}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Post content"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <ProtectedComponent collection={collection} action="create">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Creating...' : 'Create Item'}</span>
              </button>
            </ProtectedComponent>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
