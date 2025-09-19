'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface CreateEventStep3Props {
  onFinish: () => void;
  onPrevious: () => void;
  formData: {
    logo: File | null;
    banner: File | null;
  };
  updateFormData: (updates: {
    logo?: File | null;
    banner?: File | null;
  }) => void;
  isCreating: boolean;
}

export default function CreateEventStep3({ onFinish, onPrevious, formData, updateFormData, isCreating }: CreateEventStep3Props) {

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PNG, JPG, WEBP, or SVG file');
        return;
      }
      
      updateFormData({ logo: file });
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PNG, JPG, WEBP, or SVG file');
        return;
      }
      
      updateFormData({ banner: file });
    }
  };

  const removeLogo = () => {
    updateFormData({ logo: null });
  };

  const removeBanner = () => {
    updateFormData({ banner: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'banner') => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PNG, JPG, WEBP, or SVG file');
        return;
      }
      
      if (type === 'logo') {
        updateFormData({ logo: file });
      } else {
        updateFormData({ banner: file });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinish();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event recognition</h1>
        <p className="text-sm text-gray-600">
          <span className="text-red-500">*</span> indicates a required field
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Event logo
          </label>
          <div className="flex space-x-6">
            {/* Upload Area */}
            <div 
              className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer relative overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'logo')}
            >
              <input
                type="file"
                accept="image/png,image/jpg,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              
              {formData.logo ? (
                <div className="relative w-full h-full">
                  <img
                    src={URL.createObjectURL(formData.logo)}
                    alt="Logo preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Icon icon="mdi:close" className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="logo-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                  <Icon icon="mdi:plus" className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload</span>
                </label>
              )}
            </div>

            {/* Guidelines */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">File Size:</span> Up to 5mb
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Optimal Dimension:</span> 600px x 600px
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Supported file type:</span> PNG, JPG, WEBP, SVG.
              </div>
              {formData.logo && (
                <div className="text-sm text-green-600 mt-2">
                  <Icon icon="mdi:check-circle" className="w-4 h-4 inline mr-1" />
                  Logo uploaded: {formData.logo.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Banner */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Event banner
          </label>
          <div 
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer relative overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'banner')}
          >
            <input
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/webp,image/svg+xml"
              onChange={handleBannerUpload}
              className="hidden"
              id="banner-upload"
            />
            
            {formData.banner ? (
              <div className="relative w-full h-full">
                <img
                  src={URL.createObjectURL(formData.banner)}
                  alt="Banner preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeBanner}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label htmlFor="banner-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                <Icon icon="mdi:plus" className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload</span>
              </label>
            )}
          </div>
          
          {formData.banner && (
            <div className="text-sm text-green-600 mt-2">
              <Icon icon="mdi:check-circle" className="w-4 h-4 inline mr-1" />
              Banner uploaded: {formData.banner.name}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Icon icon="mdi:information" className="w-4 h-4" />
            <span>3/3 - How to recognize your Event</span>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onPrevious}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Previous
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="w-4 h-4" />
                  <span>Finish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
