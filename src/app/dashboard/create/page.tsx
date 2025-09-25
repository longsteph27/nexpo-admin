'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { directusHelpers, type Event } from '@/lib/directus';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  location: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

const eventTypes = [
  {
    id: 'offline',
    label: 'Offline Event',
    description: 'Conduct an event in a physical venue for face-to-face networking',
    icon: 'lucide:map-pin',
  },
  {
    id: 'online',
    label: 'Online Event',
    description: 'Host a digital event that engages participants who join remotely',
    icon: 'lucide:monitor',
  },
  {
    id: 'hybrid',
    label: 'Hybrid Event',
    description: 'Expand your in-person event to reach a wider audience',
    icon: 'lucide:users',
  },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { selectedTenant } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: 'Vietnam Design Connect 2025',
      start_date: '2025-12-18',
      end_date: '2025-12-18',
      location: 'SECC - Saigon Exhibition & Convention Center, District 7, HCMC',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: EventFormData) => {
    if (!selectedTenant) {
      console.error('No tenant selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await directusHelpers.createEvent({
        ...data,
        tenant_id: selectedTenant.id,
        status: 'draft',
      });

      if (result.success) {
        router.push('/dashboard');
      } else {
        console.error('Failed to create event:', result.error);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                  <p className="text-gray-600">* indicates a required field</p>
                </div>

                <div className="space-y-4">
                  {/* Event Name */}
                  <Input
                    label="Event Name*"
                    placeholder="Your fancy event name"
                    error={errors.name?.message}
                    {...register('name')}
                  />

                  {/* Event Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      placeholder="Describe your event..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
                <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {watchedValues.name || 'Event Name'}
                </h3>
                <p className="text-gray-600">{watchedValues.description || 'Event description will appear here...'}</p>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <div></div>
              <Button
                onClick={handleNext}
                icon="lucide:arrow-right"
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Location</h2>
                  <p className="text-gray-600">* indicates a required field</p>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date*"
                    type="date"
                    error={errors.start_date?.message}
                    {...register('start_date')}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    error={errors.end_date?.message}
                    {...register('end_date')}
                  />
                </div>

                {/* Location */}
                <Input
                  label="Location"
                  placeholder="SECC - Saigon Exhibition & Convention Center, District 7, HCMC"
                  rightIcon="lucide:map-pin"
                  error={errors.location?.message}
                  {...register('location')}
                />
              </div>

              {/* Right Column - Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                <div className="w-full h-48 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl mb-4"></div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Icon icon="lucide:calendar" className="w-4 h-4 mr-2" />
                    <span>{watchedValues.start_date}{watchedValues.end_date && ` - ${watchedValues.end_date}`}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Icon icon="lucide:map-pin" className="w-4 h-4 mr-2" />
                    <span>{watchedValues.location || 'Location not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                icon="lucide:arrow-left"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                icon="lucide:arrow-right"
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Event recognition</h2>
                  <p className="text-gray-600">* indicates a required field</p>
                </div>

                {/* Event Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event logo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Icon icon="lucide:upload" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>File Size: Up to 5mb</p>
                      <p>Optimal Dimension: 600px x 600px</p>
                      <p>Supported file type: PNG, JPG, WEBP, SVG.</p>
                    </div>
                  </div>
                </div>

                {/* Event Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event banner
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                    <Icon icon="lucide:upload" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-2xl p-8">
                <div className="w-full h-48 bg-gradient-to-br from-orange-300 to-yellow-400 rounded-xl"></div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                icon="lucide:arrow-left"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                icon="lucide:check"
                iconPosition="right"
                className="gradient-primary"
              >
                Finish
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`
                      w-16 h-1 mx-2
                      ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-16 text-sm">
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                Your fancy event name
              </span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                Where to know about your Event
              </span>
              <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                How to recognize your Event
              </span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </DashboardLayout>
  );
}
