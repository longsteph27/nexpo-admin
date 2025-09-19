'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { collectionsAPI } from '@/lib/collections-api';
import FileUpload from './FileUpload';
import ProtectedComponent from '@/components/ProtectedComponent';

interface EventData {
  // Basic Information
  name: string;
  category: string;
  
  // Event Location
  event_type: 'offline' | 'online' | 'hybrid';
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  
  // Event Recognition
  logo?: File;
  banner?: File;
  description?: string;
}

interface CreateEventFlowProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventFlow({ onClose, onSuccess }: CreateEventFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState<EventData>({
    name: '',
    category: '',
    event_type: 'offline',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, title: 'Basic Information', subtitle: 'Your fancy event name' },
    { id: 2, title: 'Event Location', subtitle: 'Where to know about your Event' },
    { id: 3, title: 'Event Recognition', subtitle: 'How to recognize your Event' }
  ];

  const eventTypes = [
    {
      id: 'offline',
      title: 'Offline Event',
      description: 'Conduct an event in a physical venue for face-to-face networking',
      icon: 'mdi:map-marker',
      color: 'blue'
    },
    {
      id: 'online',
      title: 'Online Event',
      description: 'Host a digital event that engages participants who join remotely',
      icon: 'mdi:account-group',
      color: 'gray'
    },
    {
      id: 'hybrid',
      title: 'Hybrid Event',
      description: 'Expand your in-person event to reach a wider audience',
      icon: 'mdi:account-network',
      color: 'gray'
    }
  ];

  const handleInputChange = (field: keyof EventData, value: string | File) => {
    setEventData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare the event data for submission
      const submitData = {
        name: eventData.name,
        category: eventData.category,
        event_type: eventData.event_type,
        start_date: eventData.start_date,
        start_time: eventData.start_time,
        end_date: eventData.end_date,
        end_time: eventData.end_time,
        location: eventData.location,
        description: eventData.description,
        status: 'draft'
      };

      await collectionsAPI.createItem('events', submitData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Category*
        </label>
        <select
          value={eventData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Select Category</option>
          <option value="design">Design</option>
          <option value="technology">Technology</option>
          <option value="business">Business</option>
          <option value="education">Education</option>
          <option value="healthcare">Healthcare</option>
          <option value="entertainment">Entertainment</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Name*
        </label>
        <input
          type="text"
          value={eventData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter event name"
          className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Event Type*
        </label>
        <div className="grid grid-cols-1 gap-4">
          {eventTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => handleInputChange('event_type', type.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                eventData.event_type === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Icon
                  icon={type.icon}
                  className={`w-6 h-6 ${
                    eventData.event_type === type.id ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
                <div>
                  <h3 className="font-medium text-gray-900">{type.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date*
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={eventData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="flex-1 px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="time"
              value={eventData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              className="flex-1 px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date*
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={eventData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className="flex-1 px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="time"
              value={eventData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              className="flex-1 px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={eventData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="Enter event location"
          className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Logo
        </label>
        <FileUpload
          onFileSelect={(file) => handleInputChange('logo', file)}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          maxSize={5}
          className="p-8"
          placeholder="Upload"
          guidelines={[
            'File Size: Up to 5mb',
            'Optimal Dimension: 600px x 600px',
            'Supported file type: PNG, JPG, WEBP, SVG'
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Banner
        </label>
        <FileUpload
          onFileSelect={(file) => handleInputChange('banner', file)}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          maxSize={10}
          className="p-12"
          placeholder="Upload"
          guidelines={[
            'File Size: Up to 10mb',
            'Optimal Dimension: 1200px x 400px',
            'Supported file type: PNG, JPG, WEBP, SVG'
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={eventData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter event description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return eventData.name && eventData.category;
      case 2:
        return eventData.start_date && eventData.start_time && eventData.end_date && eventData.end_time;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create Event</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon icon="mdi:close" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.id}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.subtitle}</p>
                </div>
                {index < steps.length - 1 && (
                  <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-96 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-sm text-gray-500">
              * indicates a required field
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600">
                <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Icon icon="mdi:information" className="w-4 h-4" />
            <span>{currentStep}/3 - {steps[currentStep - 1].subtitle}</span>
          </div>

          <div className="flex items-center space-x-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <ProtectedComponent collection="events" action="create">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading ? (
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
              </ProtectedComponent>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
