'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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

export default function CreateEventStep1Page() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
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
    setIsSubmitting(true);
    try {
      // Here you would typically save the data and proceed to next step
      console.log('Event data:', data);
      
      // For now, just redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    // For now, just redirect to dashboard
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.push('/events');
  };

  return (
    <DashboardLayout title="Create Event" subtitle="Step 1: Basic Information">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Event</h1>

        {/* Progress Indicator */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                  step === 1 ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                {step}
              </div>
              <p className={`text-sm mt-2 ${step === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                Step {step}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
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
            <Button
              type="button"
              onClick={handleBack}
              variant="secondary"
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button type="button" onClick={handleNext} variant="primary">
              Next
              <Icon icon="lucide:arrow-right" className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
