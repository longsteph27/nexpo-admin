'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface CreateEventStep2Props {
  onNext: () => void;
  onPrevious: () => void;
  formData: {
    eventType: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location: string;
  };
  updateFormData: (updates: {
    eventType?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    location?: string;
  }) => void;
}

export default function CreateEventStep2({ onNext, onPrevious, formData, updateFormData }: CreateEventStep2Props) {

  const eventTypes = [
    {
      id: 'offline',
      name: 'Offline Event',
      description: 'Conduct an event in a physical venue for face-to-face networking.',
      icon: 'mdi:map-marker'
    },
    {
      id: 'online',
      name: 'Online Event',
      description: 'Host a digital event that engages participants who join remotely.',
      icon: 'mdi:account'
    },
    {
      id: 'hybrid',
      name: 'Hybrid Event',
      description: 'Expand your in-person event to reach a wider audience.',
      icon: 'mdi:account'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Location</h1>
        <p className="text-sm text-gray-600">
          <span className="text-red-500">*</span> indicates a required field
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Event Type<span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-4">
            {eventTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => updateFormData({ eventType: type.id })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.eventType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon 
                    icon={type.icon} 
                    className={`w-6 h-6 mt-1 ${
                      formData.eventType === type.id ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <h3 className={`font-medium ${
                      formData.eventType === type.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {type.name}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      formData.eventType === type.id ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start day<span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormData({ startDate: e.target.value })}
                className="w-full px-3 py-2 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                required
              />
              <Icon 
                icon="mdi:calendar" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              />
            </div>
            <div className="flex-1 relative">
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => updateFormData({ startTime: e.target.value })}
                className="w-full px-3 py-2 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                required
              />
              <Icon 
                icon="mdi:clock" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* End Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End date<span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormData({ endDate: e.target.value })}
                className="w-full px-3 py-2 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                required
              />
              <Icon 
                icon="mdi:calendar" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              />
            </div>
            <div className="flex-1 relative">
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => updateFormData({ endTime: e.target.value })}
                className="w-full px-3 py-2 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                required
              />
              <Icon 
                icon="mdi:clock" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => updateFormData({ location: e.target.value })}
              className="w-full px-3 py-2 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent pr-10"
              placeholder="Enter location"
            />
            <Icon 
              icon="mdi:map-marker" 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Icon icon="mdi:information" className="w-4 h-4" />
            <span>2/3 - Where to know about your Event</span>
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
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              <span>Next</span>
              <Icon icon="mdi:chevron-right" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
