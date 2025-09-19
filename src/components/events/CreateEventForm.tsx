'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useCollectionPermissions } from '@/contexts/PermissionContext';
import { eventsApi } from '@/lib/events-api';

interface CreateEventFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventFormData {
  // Basic Information
  category: string;
  name: string;
  
  // Event Location
  eventType: 'offline' | 'online' | 'hybrid';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  
  // Event Recognition
  logo?: File;
  banner?: File;
}

const eventTypes = [
  {
    value: 'offline',
    label: 'Offline Event',
    description: 'Conduct an event in a physical venue for face-to-face networking',
    icon: 'mdi:map-marker-star'
  },
  {
    value: 'online',
    label: 'Online Event',
    description: 'Host a digital event that engages participants who join remotely',
    icon: 'mdi:account-group'
  },
  {
    value: 'hybrid',
    label: 'Hybrid Event',
    description: 'Expand your in-person event to reach a wider audience',
    icon: 'mdi:account'
  }
];

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

export default function CreateEventForm({ isOpen, onClose }: CreateEventFormProps) {
  const eventPermissions = useCollectionPermissions('events');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>({
    category: 'Design',
    name: 'Vietnam Design Connnect 2025',
    eventType: 'offline',
    startDate: '12/18/2022',
    startTime: '1:00 PM',
    endDate: '12/18/2022',
    endTime: '1:00 PM',
    location: 'SECC - Saigon Exhibition & Convention Center, District 7, HCMC',
    logo: undefined,
    banner: undefined
  });

  const updateFormData = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Convert form data to API format
      const eventData = {
        name: formData.name,
        description: `Event category: ${formData.category}`,
        start_date: new Date(`${formData.startDate} ${formData.startTime}`).toISOString(),
        end_date: formData.endDate ? new Date(`${formData.endDate} ${formData.endTime}`).toISOString() : undefined,
        location: formData.location,
        status: 'draft' as const,
        tenant_id: 1 // Default tenant
      };

      // Create event using the API
      await eventsApi.createEvent(eventData);
      
      // Close form and show success message
      onClose();
      console.log('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleFileUpload = (field: 'logo' | 'banner', file: File) => {
    updateFormData(field, file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden"
      >
        {/* Left Panel - Background Design */}
        <div className="w-1/3 relative overflow-hidden">
          {/* Step 1 Background - Blue abstract design */}
          {currentStep === 1 && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full opacity-30"></div>
                <div className="absolute top-32 right-16 w-24 h-24 bg-white rounded-full opacity-20"></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 bg-white rounded-full opacity-25"></div>
                <div className="absolute bottom-32 right-10 w-20 h-20 bg-white rounded-full opacity-30"></div>
              </div>
            </div>
          )}
          
          {/* Step 2 Background - Orange/Yellow gradient */}
          {currentStep === 2 && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-16 left-12 w-28 h-28 bg-white rounded-full opacity-25"></div>
                <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full opacity-30"></div>
                <div className="absolute bottom-24 left-16 w-36 h-36 bg-white rounded-full opacity-20"></div>
                <div className="absolute bottom-40 right-12 w-24 h-24 bg-white rounded-full opacity-25"></div>
              </div>
            </div>
          )}
          
          {/* Step 3 Background - Bridge/Industrial design */}
          {currentStep === 3 && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800">
              <div className="absolute inset-0 opacity-30">
                {/* Bridge structure elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-400"></div>
                <div className="absolute top-8 left-1/4 w-1 h-32 bg-gray-400"></div>
                <div className="absolute top-8 right-1/4 w-1 h-32 bg-gray-400"></div>
                <div className="absolute top-40 left-0 w-full h-1 bg-gray-400"></div>
                <div className="absolute bottom-20 left-0 w-full h-2 bg-orange-400"></div>
                <div className="absolute bottom-16 left-1/3 w-2 h-16 bg-orange-500"></div>
                <div className="absolute bottom-16 right-1/3 w-2 h-16 bg-orange-500"></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Form */}
        <div className="w-2/3 p-8 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentStep === 1 && 'Basic Information'}
                {currentStep === 2 && 'Event Location'}
                {currentStep === 3 && 'Event recognition'}
              </h2>
              <p className="text-red-500 text-sm">* indicates a required field</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <Icon icon="mdi:close" className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Event Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Event Category*
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-nexpo-blue focus:outline-none bg-white appearance-none"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Event Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Event Name*
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-nexpo-blue focus:outline-none"
                      placeholder="Enter event name"
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Event Type*
                    </label>
                    <div className="space-y-4">
                      {eventTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => updateFormData('eventType', type.value)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            formData.eventType === type.value
                              ? 'border-nexpo-blue bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${
                              formData.eventType === type.value
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Icon icon={type.icon} className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{type.label}</h3>
                              <p className="text-sm text-gray-600 mt-2">{type.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Start day
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.startDate}
                            onChange={(e) => updateFormData('startDate', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-nexpo-blue focus:outline-none"
                            placeholder="MM/DD/YYYY"
                          />
                          <button 
                            onClick={() => updateFormData('startDate', '')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.startTime}
                            onChange={(e) => updateFormData('startTime', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-nexpo-blue focus:outline-none"
                            placeholder="HH:MM AM/PM"
                          />
                          <button 
                            onClick={() => updateFormData('startTime', '')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        End date
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.endDate}
                            onChange={(e) => updateFormData('endDate', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-nexpo-blue focus:outline-none"
                            placeholder="MM/DD/YYYY"
                          />
                          <button 
                            onClick={() => updateFormData('endDate', '')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.endTime}
                            onChange={(e) => updateFormData('endTime', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-nexpo-blue focus:outline-none"
                            placeholder="HH:MM AM/PM"
                          />
                          <button 
                            onClick={() => updateFormData('endTime', '')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Location
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-nexpo-blue focus:outline-none"
                        placeholder="Enter event location"
                      />
                      <button className="text-gray-400 hover:text-gray-600 p-2">
                        <Icon icon="mdi:map-marker" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Event Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Event logo
                    </label>
                    <div className="flex space-x-6">
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors duration-200 cursor-pointer bg-gray-50">
                        <div className="text-center">
                          <Icon icon="mdi:plus" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-500">Upload</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>File Size:</strong> Up to 5mb</p>
                        <p><strong>Optimal Dimension:</strong> 600px x 600px</p>
                        <p><strong>Supported file type:</strong> PNG, JPG, WEBP, SVG.</p>
                      </div>
                    </div>
                  </div>

                  {/* Event Banner */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Event banner
                    </label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors duration-200 cursor-pointer bg-gray-50">
                      <div className="text-center">
                        <Icon icon="mdi:plus" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-500">Upload</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Icon icon="mdi:information-outline" className="w-4 h-4" />
              <span>
                {currentStep}/3 - {
                  currentStep === 1 ? 'Your fancy event name' :
                  currentStep === 2 ? 'Where to know about your Event' :
                  'How to recognize your Event'
                }
              </span>
            </div>
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Back
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Next &gt;
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-nexpo-blue text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>Finish</span>
                  <Icon icon="mdi:check" className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}