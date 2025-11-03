'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { useCreateEvent } from '@/features/events/hooks/useEvents';
import { BasicInformationStep, EventLocationStep, EventRecognitionStep } from '@/features/events/components/create';

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = Number(searchParams.get('step') || '1');
  const { selectedTenant } = useAuthStore();

  // Form state across steps
  const [category, setCategory] = useState('Design');
  const [name, setName] = useState('Vietnam Design Connnect 2025');
  const [description] = useState('');
  const [eventType, setEventType] = useState<'offline' | 'online' | 'hybrid' | null>('offline');
  const [startDate, setStartDate] = useState('2025-12-18');
  const [startTime, setStartTime] = useState('13:00');
  const [endDate, setEndDate] = useState('2025-12-18');
  const [endTime, setEndTime] = useState('13:00');
  const [location, setLocation] = useState('SECC – Saigon Exhibition & Convention Center, District 7, HCMC');
  const [logoFileId, setLogoFileId] = useState<string>('');
  const [bannerFileId, setBannerFileId] = useState<string>('');

  const handleSetLogoFileId = (value: string | null) => {
    setLogoFileId(value || '');
  };

  const handleSetBannerFileId = (value: string | null) => {
    setBannerFileId(value || '');
  };
  
  const createEventMutation = useCreateEvent();

  const goToStep = (nextStep: number) => {
    const clamped = Math.min(3, Math.max(1, nextStep));
    const url = `/events/create?step=${clamped}`;
    router.replace(url);
  };

  const handleSubmit = async () => {
    if (!selectedTenant?.id) {
      toast.error('No tenant selected. Please select a tenant first.');
      return;
    }

    try {
      const eventData = {
        category,
        name,
        description,
        event_type: eventType,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        location,
        logo: logoFileId || undefined,
        banner: bannerFileId || undefined,
        tenant_id: selectedTenant.id,
        status: 'draft' as const,
      };

      const result = await createEventMutation.mutateAsync(eventData);
      
      // Check if creation was successful
      if (result.success) {
        toast.success('Event created successfully!');
        // Navigation will happen, and React Query will automatically refetch the list
        router.push('/events');
      } else {
        throw new Error(result.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
  return (
          <BasicInformationStep
            category={category}
            setCategory={setCategory}
            name={name}
            setName={setName}
          />
        );
      case 2:
        return (
          <EventLocationStep
            eventType={eventType}
            setEventType={setEventType}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endDate={endDate}
            setEndDate={setEndDate}
            endTime={endTime}
            setEndTime={setEndTime}
            location={location}
            setLocation={setLocation}
          />
        );
      case 3:
        return (
          <EventRecognitionStep
            logoFileId={logoFileId}
            setLogoFileId={handleSetLogoFileId}
            bannerFileId={bannerFileId}
            setBannerFileId={handleSetBannerFileId}
            selectedTenant={selectedTenant}
          />
        );
      default:
        return null;
    }
  };

  // Get background image based on step
  const getBackgroundImage = () => {
    switch (step) {
      case 1:
        return "url('/events_step1.png')";
      case 2:
        return "url('/events_step2.png')";
      case 3:
        return "url('/events_step3.png')";
      default:
        return "url('/events_step1.png')";
    }
  };

  return (
    <div className="h-full grid grid-cols-12 gap-0 min-h-full">
      {/* Left side - Background Image */}
      <div className="hidden md:block col-span-4 h-full">
        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: getBackgroundImage() }} />
                </div>

      {/* Right side - Content */}
      <div className="col-span-12 md:col-span-8 h-full relative">
        {renderStepContent()}
        
        {/* Navigation Buttons */}
        <div className="fixed md:absolute right-6 bottom-6 flex items-center gap-3 z-10">
            {step > 1 && (
              <Button variant="secondary" onClick={() => goToStep(step - 1)}>
                <Icon icon="lucide:chevron-left" className="w-5 h-5 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
            <Button className="bg-slate-100" variant="default" onClick={() => goToStep(step + 1)}>
                Next
                <Icon icon="lucide:chevron-right" className="w-5 h-5 ml-2" />
              </Button>
            ) : (
            <Button variant="gradient" loading={createEventMutation.isPending} onClick={handleSubmit}>
                Finish
                <Icon icon="lucide:check" className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
  );
}
