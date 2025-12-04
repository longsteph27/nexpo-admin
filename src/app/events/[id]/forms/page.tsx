"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formsApi, FormCard } from "@/features/forms";
import type { FormSummary } from "@/features/forms";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button-base";
import { Icon } from "@iconify/react";

export default function EventFormsPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedTenant } = useAuth();
  const eventId = String(params?.id || "");
  
  const tenantId = selectedTenant?.id;

  // Fetch other forms (non-registration)
  const {
    data: forms = [],
    isLoading: formsLoading,
    error,
  } = useQuery<FormSummary[]>({
    queryKey: ["other-forms", eventId, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await formsApi.getOtherForms(Number(eventId), tenantId);
      if (!result.success) {
        throw new Error(result.error || "Failed to load forms");
      }
      return result.data ?? [];
    },
    enabled: !!eventId && !!tenantId,
  });

  const handleCreateForm = () => {
    router.push(`/events/${eventId}/forms/new`);
  };

  if (formsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-content-secondary">Loading forms...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon icon="lucide:alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-content-secondary">Failed to load forms</p>
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
            Other Forms
          </h1>
          <p className="text-content-secondary mt-1 text-sm">
            Manage contact, feedback, and other forms for your event
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
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon icon="lucide:form-input" className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-content-primary mb-2">
            No Other Forms Yet
          </h3>
          <p className="text-sm text-content-tertiary max-w-md mx-auto mb-4">
            Create forms for contact, feedback, surveys, or any other purpose.
          </p>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleCreateForm}
          >
            <Icon icon="lucide:plus" className="w-3 h-3 mr-1" />
            Create Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
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
