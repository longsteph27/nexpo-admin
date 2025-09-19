'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface CreateEventStep1Props {
  onNext: () => void;
  onPrevious: () => void;
  formData: {
    category: string;
    name: string;
  };
  updateFormData: (updates: { category?: string; name?: string }) => void;
}

export default function CreateEventStep1({ onNext, onPrevious, formData, updateFormData }: CreateEventStep1Props) {

  const categories = [
    'Design',
    'Technology',
    'Business',
    'Marketing',
    'Education',
    'Healthcare',
    'Finance',
    'Entertainment'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Basic Information</h1>
        <p className="text-sm text-gray-600">
          <span className="text-red-500">*</span> indicates a required field
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Category<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) => updateFormData({ category: e.target.value })}
              className="w-full px-3 py-2 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent appearance-none"
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Icon 
              icon="mdi:chevron-down" 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="w-full px-3 py-2 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
            placeholder="Enter event name"
            required
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Icon icon="mdi:information" className="w-4 h-4" />
            <span>1/3 - Your fancy event name</span>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
          >
            <span>Next</span>
            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
