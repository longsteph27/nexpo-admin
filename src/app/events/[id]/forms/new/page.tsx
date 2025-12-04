'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCreateForm } from '@/features/forms';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

export default function CreateFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedTenant } = useAuth();
  const eventId = String(params?.id || '');
  const tenantId = selectedTenant?.id;

  // Check if this is a registration form from query parameter
  const isRegistrationForm = searchParams.get('type') === 'registration';

  const [formData, setFormData] = useState({
    title: '',
    submit_label: 'Submit',
    success_message: 'Thank you for your submission!',
    status: 'draft' as 'draft' | 'published' | 'archived',
    on_success: 'message' as 'redirect' | 'message',
    redirect_url: '',
    is_registration: isRegistrationForm, // Auto-set based on query parameter
  });

  const createFormMutation = useCreateForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      toast.error('No tenant selected');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Form title is required');
      return;
    }

    const formPayload = {
      status: formData.status,
      on_success: formData.on_success,
      redirect_url: formData.on_success === 'redirect' ? formData.redirect_url : undefined,
      is_registration: formData.is_registration,
      translations: {
        create: [
          {
            forms_id: '', // Will be set after form creation
            languages_code: 'en-US',
            title: formData.title,
            submit_label: formData.submit_label,
            success_message: formData.success_message,
          },
          {
            forms_id: '', // Will be set after form creation
            languages_code: 'vi-VN',
            title: formData.title,
            submit_label: formData.submit_label,
            success_message: formData.success_message,
          },
        ],
        update: [],
        delete: [],
      },
      fields: {
        create: [],
        update: [],
        delete: [],
      },
    };

    createFormMutation.mutate(
      { eventId, tenantId, formData: formPayload },
      {
        onSuccess: (data) => {
          toast.success('Form created successfully!');
          // Navigate to the form builder
          if (data?.data?.id) {
            router.push(`/events/${eventId}/forms/${data.data.id}`);
          } else {
            router.push(`/events/${eventId}/forms`);
          }
        },
        onError: (error) => {
          toast.error('Failed to create form', {
            description: error.message,
          });
        },
      }
    );
  };

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon icon="lucide:alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No Tenant Selected</h3>
          <p className="text-content-secondary">Please select a tenant to create a form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content-primary mb-2">
          {isRegistrationForm ? 'Create Registration Form' : 'Create New Form'}
        </h1>
        <p className="text-content-secondary">
          {isRegistrationForm 
            ? 'Create a new registration form for your event.' 
            : 'Create a new form for your event.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">
                Form Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter form title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">
                Submit Button Label
              </label>
              <Input
                value={formData.submit_label}
                onChange={(e) => setFormData(prev => ({ ...prev, submit_label: e.target.value }))}
                placeholder="Submit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">
                Success Message
              </label>
              <Input
                value={formData.success_message}
                onChange={(e) => setFormData(prev => ({ ...prev, success_message: e.target.value }))}
                placeholder="Thank you for your submission!"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Form Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'published' | 'archived') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">
                On Success Action
              </label>
              <Select
                value={formData.on_success}
                onValueChange={(value: 'redirect' | 'message') => 
                  setFormData(prev => ({ ...prev, on_success: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Show Message</SelectItem>
                  <SelectItem value="redirect">Redirect to URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.on_success === 'redirect' && (
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">
                  Redirect URL
                </label>
                <Input
                  value={formData.redirect_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirect_url: e.target.value }))}
                  placeholder="https://example.com/thank-you"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_registration"
                checked={formData.is_registration}
                onChange={(e) => setFormData(prev => ({ ...prev, is_registration: e.target.checked }))}
                disabled={isRegistrationForm}
                className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="is_registration" className="text-sm font-medium text-content-primary">
                This is a registration form
                {isRegistrationForm && <span className="text-xs text-blue-600 ml-1">(Auto-set for registration forms)</span>}
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createFormMutation.isPending}
          >
            {createFormMutation.isPending ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                Create Form
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
