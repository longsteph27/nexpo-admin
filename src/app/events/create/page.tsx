'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CreateEventStep1 from '@/components/events/CreateEventStep1';
import CreateEventStep2 from '@/components/events/CreateEventStep2';
import CreateEventStep3 from '@/components/events/CreateEventStep3';

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 data
    category: '',
    name: '',
    // Step 2 data
    eventType: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    // Step 3 data
    logo: null as File | null,
    banner: null as File | null
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const step = searchParams.get('step');
    if (step) {
      const stepNumber = parseInt(step, 10);
      if (stepNumber >= 1 && stepNumber <= 3) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams]);

  const handleNext = () => {
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      router.push(`/events/create?step=${nextStep}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      router.push(`/events/create?step=${prevStep}`);
    } else {
      router.push('/events');
    }
  };

  const handleFinish = async () => {
    try {
      setIsCreating(true);
      
      // Prepare event data for API
      const eventData = {
        name: formData.name,
        description: `Event category: ${formData.category}`,
        start_date: formData.startDate,
        end_date: formData.endDate,
        location: formData.location,
        status: 'draft', // Default status
        // Add other fields as needed
      };
      
      // Create event via API
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
      
      const result = await response.json();
      console.log('Event created successfully:', result);
      
      // Redirect to events list
      router.push('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateEventStep1 
            onNext={handleNext} 
            onPrevious={handlePrevious}
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <CreateEventStep2 
            onNext={handleNext} 
            onPrevious={handlePrevious}
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <CreateEventStep3 
            onFinish={handleFinish} 
            onPrevious={handlePrevious}
            formData={formData}
            updateFormData={updateFormData}
            isCreating={isCreating}
          />
        );
      default:
        return (
          <CreateEventStep1 
            onNext={handleNext} 
            onPrevious={handlePrevious}
            formData={formData}
            updateFormData={updateFormData}
          />
        );
    }
  };

  return (
    <ProtectedRoute>
      <main className="flex h-screen">
          {/* Left Panel - Background */}
          <div className="w-1/3 relative overflow-hidden">
            {currentStep === 1 && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
                <div className="absolute inset-0 bg-blue-400 opacity-20"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-blue-300 rounded-full opacity-30"></div>
                <div className="absolute top-32 right-10 w-24 h-24 bg-blue-200 rounded-full opacity-40"></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-300 rounded-full opacity-25"></div>
                <div className="absolute bottom-32 right-20 w-28 h-28 bg-blue-200 rounded-full opacity-35"></div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-green-500 to-green-600">
                <div className="absolute inset-0 bg-green-400 opacity-20"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-green-300 rounded-full opacity-30"></div>
                <div className="absolute top-32 right-10 w-24 h-24 bg-green-200 rounded-full opacity-40"></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 bg-green-300 rounded-full opacity-25"></div>
                <div className="absolute bottom-32 right-20 w-28 h-28 bg-green-200 rounded-full opacity-35"></div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
                <div className="absolute inset-0 bg-orange-400 opacity-20"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-orange-300 rounded-full opacity-30"></div>
                <div className="absolute top-32 right-10 w-24 h-24 bg-orange-200 rounded-full opacity-40"></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 bg-orange-300 rounded-full opacity-25"></div>
                <div className="absolute bottom-32 right-20 w-28 h-28 bg-orange-200 rounded-full opacity-35"></div>
              </div>
            )}
          </div>

          {/* Right Panel - Form */}
          <div className="w-2/3 bg-white flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              {renderStep()}
            </div>
          </div>
        </main>
    </ProtectedRoute>
  );
}
