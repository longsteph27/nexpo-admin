'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { formsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import FormCard from '@/components/forms/FormCard';

export default function FormsRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedTenant } = useAuth();
  const eventId = String(params?.id || '');
  
  const tenantId = selectedTenant?.id;

  // Fetch registration forms
  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ['registration-forms', eventId, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await formsApi.getRegistrationForms(Number(eventId), tenantId);
      return result.success ? result.data : [];
    },
    enabled: !!eventId && !!tenantId,
  });

  const handleCreateForm = () => {
    router.push(`/events/${eventId}/forms/new`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-content-secondary">Loading registration forms...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon icon="lucide:alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-content-secondary">Failed to load registration forms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">
            Forms Registration
          </h1>
          <p className="text-content-secondary mt-1 text-sm">
            Manage registration forms for your event
          </p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          onClick={handleCreateForm}
        >
          <Icon icon="lucide:plus" className="w-3 h-3 mr-1" />
          Create Form
        </Button>
      </div>

      {/* Content */}
      {forms.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon icon="lucide:user-plus" className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-base font-semibold text-content-primary mb-2">
            No Registration Forms Yet
          </h3>
          <p className="text-sm text-content-tertiary max-w-md mx-auto mb-4">
            Create your first registration form to start collecting attendee information.
          </p>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleCreateForm}
          >
            <Icon icon="lucide:plus" className="w-3 h-3 mr-1" />
            Create Registration Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form: any) => (
            <FormCard
              key={form.id}
              form={form}
              eventId={eventId}
              lang="en-US"
            />
          ))}
        </div>
      )}
    </div>
  );
}

