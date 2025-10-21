'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { directusHelpers } from '@/lib/directus';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

interface FormAnswer {
  id: string;
  value?: string;
  field?: {
    id: string;
    name: string;
    type: string;
    translations?: Array<{
      languages_code: string;
      label?: string;
    }>;
  };
}

interface FormSubmission {
  id: string;
  date_sumitted?: string;
  status?: string;
  form?: {
    id: string;
    translations?: Array<{
      languages_code: string;
      title?: string;
    }>;
  };
  answers?: FormAnswer[];
}

interface Registration {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  checkin_status?: boolean;
  date_created?: string;
  badge_id?: string;
  redeem_id?: string;
  submissions?: FormSubmission; // m2o relationship, not array
}

export default function RegistrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = params.registrationId as string;
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<{
    full_name?: string;
    email?: string;
    phone_number?: string;
    badge_id?: string;
    redeem_id?: string;
    formAnswers?: { [key: string]: string };
  }>({});

  // Fetch single registration with full form data
  const { data: registration, isLoading, error } = useQuery({
    queryKey: ['registration', registrationId],
    queryFn: async () => {
      const result = await directusHelpers.getRegistrationById(registrationId);
      return result.success ? result.data : null;
    },
    enabled: !!registrationId,
  });

  // Update registration mutation
  const updateRegistrationMutation = useMutation({
    mutationFn: async (data: {
      full_name?: string;
      email?: string;
      phone_number?: string;
      badge_id?: string;
      redeem_id?: string;
    }) => {
      const result = await directusHelpers.updateRegistration(registrationId, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration', registrationId] });
      toast.success('Registration updated successfully!');
      setIsEditing(false);
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update registration: ${error.message}`);
      setIsSaving(false);
    },
  });

  // Update form answer mutation
  const updateFormAnswerMutation = useMutation({
    mutationFn: async ({ answerId, value }: { answerId: string; value: string }) => {
      const result = await directusHelpers.updateFormAnswer(answerId, { value });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration', registrationId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update form answer: ${error.message}`);
    },
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get all form answers for display in detail
  const getFormAnswers = (registration: Registration) => {
    console.log('[getFormAnswers Detail] Registration data:', registration);
    console.log('[getFormAnswers Detail] Submissions:', registration.submissions);
    
    const submission = registration.submissions; // m2o relationship, not array
    console.log('[getFormAnswers Detail] Submission:', submission);
    
    if (!submission?.answers) {
      console.log('[getFormAnswers Detail] No answers found');
      return [];
    }
    
    console.log('[getFormAnswers Detail] Answers:', submission.answers);
    
    // Get all answers with English labels
    const filteredAnswers = submission.answers
      .filter(answer => {
        console.log('[getFormAnswers Detail] Processing answer:', answer);
        return answer.value && answer.field;
      })
      .map(answer => {
        const label = answer.field?.translations?.find(t => t.languages_code === 'en-US')?.label || answer.field?.name || 'Unknown Field';
        console.log('[getFormAnswers Detail] Answer label:', label, 'value:', answer.value);
        return {
          id: answer.id,
          label,
          value: answer.value || '',
          type: answer.field?.type || 'text'
        };
      });
    
    console.log('[getFormAnswers Detail] Filtered answers:', filteredAnswers);
    return filteredAnswers;
  };

  const getFormTitle = (registration: Registration) => {
    const submission = registration.submissions;
    return submission?.form?.translations?.find(t => t.languages_code === 'en-US')?.title || 'Registration Form';
  };

  // Initialize edit data when registration loads
  useEffect(() => {
    if (registration) {
      const formAnswersMap: { [key: string]: string } = {};
      const submission = (registration as Registration).submissions;
      if (submission?.answers) {
        submission.answers.forEach(answer => {
          if (answer.id && answer.value) {
            formAnswersMap[answer.id] = answer.value;
          }
        });
      }

      setEditData({
        full_name: registration.full_name || '',
        email: registration.email || '',
        phone_number: registration.phone_number || '',
        badge_id: registration.badge_id || '',
        redeem_id: registration.redeem_id || '',
        formAnswers: formAnswersMap
      });
    }
  }, [registration]);

  // Generate QR code when registration data is loaded
  useEffect(() => {
    if (registration?.id && qrCodeRef.current) {
      QRCode.toCanvas(qrCodeRef.current, registration.id, {
        width: 120,
        margin: 1,
        color: {
          dark: '#1f2937', // gray-800
          light: '#ffffff'
        }
      }).catch((err) => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [registration]);

  // Handler functions
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset editData to original values
    if (registration) {
      const formAnswersMap: { [key: string]: string } = {};
      const submission = (registration as Registration).submissions;
      if (submission?.answers) {
        submission.answers.forEach(answer => {
          if (answer.id && answer.value) {
            formAnswersMap[answer.id] = answer.value;
          }
        });
      }

      setEditData({
        full_name: registration.full_name || '',
        email: registration.email || '',
        phone_number: registration.phone_number || '',
        badge_id: registration.badge_id || '',
        redeem_id: registration.redeem_id || '',
        formAnswers: formAnswersMap
      });
    }
  };

  const handleSave = async () => {
    if (!registration) return;

    setIsSaving(true);

    try {
      // Update registration basic info
      const registrationData = {
        full_name: editData.full_name,
        email: editData.email,
        phone_number: editData.phone_number,
        badge_id: editData.badge_id,
        redeem_id: editData.redeem_id,
      };

      await updateRegistrationMutation.mutateAsync(registrationData);

      // Update form answers
      if (editData.formAnswers) {
        const submission = (registration as Registration).submissions;
        if (submission?.answers) {
          for (const answer of submission.answers) {
            if (answer.id && editData.formAnswers[answer.id] !== undefined) {
              await updateFormAnswerMutation.mutateAsync({
                answerId: answer.id,
                value: editData.formAnswers[answer.id]
              });
            }
          }
        }
      }

      toast.success('Registration updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving registration:', error);
      toast.error('Failed to update registration');
    } finally {
      setIsSaving(false);
    }
  };

  const updateEditData = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateFormAnswer = (answerId: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      formAnswers: {
        ...prev.formAnswers,
        [answerId]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-content-secondary">Loading registration details...</span>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-content-secondary">Failed to load registration details</p>
        </div>
      </div>
    );
  }

  const formAnswers = getFormAnswers(registration as Registration);
  const formTitle = getFormTitle(registration as Registration);

  return (
    <div className="relative w-full space-y-4">
      {/* Page Header */}
      <ContainerHeader className="flex items-end justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-bold text-content-primary">
              {registration.full_name || 'Unnamed Registration'}
            </h1>
            <p className="text-content-tertiary mt-1 text-sm">Registration Details</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {registration.checkin_status ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Icon icon="lucide:check-circle" className="w-4 h-4 mr-2" />
              Checked In
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              <Icon icon="lucide:clock" className="w-4 h-4 mr-2" />
              Pending Check-in
            </span>
          )}
          
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Icon icon="lucide:edit" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </ContainerHeader>

      {/* Content Sections */}
      <Container className="space-y-4">
        {/* Registration Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon icon="lucide:user" className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary">Basic Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-content-secondary">Full Name</label>
              {isEditing ? (
                <Input
                  value={editData.full_name || ''}
                  onChange={(e) => updateEditData('full_name', e.target.value)}
                  placeholder="Enter full name"
                />
              ) : (
                <p className="text-content-primary">{registration.full_name || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-content-secondary">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => updateEditData('email', e.target.value)}
                  placeholder="Enter email"
                />
              ) : (
                <p className="text-content-primary">{registration.email || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-content-secondary">Phone</label>
              {isEditing ? (
                <Input
                  value={editData.phone_number || ''}
                  onChange={(e) => updateEditData('phone_number', e.target.value)}
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-content-primary">{registration.phone_number || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Icon icon="lucide:calendar" className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary">Registration Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-content-secondary">Registered Date</label>
              <p className="text-content-primary">{formatDate(registration.date_created)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-content-secondary">Badge ID</label>
              {isEditing ? (
                <Input
                  value={editData.badge_id || ''}
                  onChange={(e) => updateEditData('badge_id', e.target.value)}
                  placeholder="Enter badge ID"
                />
              ) : (
                <p className="text-content-primary">{registration.badge_id || 'Not assigned'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-content-secondary">Redeem ID</label>
              {isEditing ? (
                <Input
                  value={editData.redeem_id || ''}
                  onChange={(e) => updateEditData('redeem_id', e.target.value)}
                  placeholder="Enter redeem ID"
                />
              ) : (
                <p className="text-content-primary">{registration.redeem_id || 'Not assigned'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Submission Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Icon icon="lucide:file-text" className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary">Form Submission</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-content-secondary">Form Title</label>
              <p className="text-content-primary">{formTitle}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-content-secondary">Submission Date</label>
              <p className="text-content-primary">{formatDate((registration as Registration).submissions?.date_sumitted)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-content-secondary">Status</label>
              <p className="text-content-primary capitalize">
                {(registration as Registration).submissions?.status || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Answers */}
      {formAnswers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Icon icon="lucide:clipboard-list" className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary">Form Answers</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formAnswers.map((answer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Icon 
                    icon={
                      answer.type === 'email' ? 'lucide:mail' :
                      answer.type === 'phone' ? 'lucide:phone' :
                      answer.type === 'number' ? 'lucide:hash' :
                      'lucide:file-text'
                    } 
                    className="w-4 h-4 text-gray-500" 
                  />
                  <label className="text-sm font-medium text-content-secondary">
                    {answer.label}
                  </label>
                </div>
                {isEditing ? (
                  <Input
                    value={editData.formAnswers?.[answer.id] || answer.value}
                    onChange={(e) => updateFormAnswer(answer.id, e.target.value)}
                    placeholder={`Enter ${answer.label.toLowerCase()}`}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-content-primary break-words">
                    {answer.value}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No Form Data */}
      {formAnswers.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <Icon icon="lucide:clipboard-x" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-content-primary mb-2">No Form Data</h3>
            <p className="text-content-secondary">This registration doesn&apos;t have any form submission data.</p>
          </div>
        </div>
      )}
      </Container>

      {/* QR Code - Fixed position in bottom right corner */}
      {registration?.id && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-2">Registration ID</div>
              <canvas 
                ref={qrCodeRef}
                className="mx-auto"
              />
              <div className="text-xs text-gray-500 mt-2 font-mono">
                {registration.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}