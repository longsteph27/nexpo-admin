'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import EmailTemplateEditor from '@/components/form-builder/EmailTemplateEditor';
import { useForm, useUpdateEmailTemplate } from '@/hooks/useForms';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';

// Individual Template Preview Component
function TemplatePreview({ 
  template, 
  qrCodeContent, 
  isRegistrationForm, 
  title,
  icon,
  iconColor = "blue"
}: {
  template: string;
  qrCodeContent: string;
  isRegistrationForm: boolean;
  title: string;
  icon: string;
  iconColor?: string;
}) {
  // Convert template format to display format
  const convertTemplateToDisplay = (template: string) => {
    return template.replace(
      /\{([^}]+)\}/g,
      (match, fieldName) => {
        return `<span class="field-placeholder">${fieldName}</span>`;
      }
    );
  };

  const displayTemplate = convertTemplateToDisplay(template);
  const displayQrCode = convertTemplateToDisplay(qrCodeContent);

  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Icon icon={icon} className={`w-4 h-4 text-${iconColor}-600`} />
        <span className="text-sm font-medium text-gray-700">{title} Preview</span>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="max-w-lg mx-auto">
          {/* Email Header */}
          <div className="text-center mb-4 pb-3 border-b border-gray-200">
            <div className={`w-8 h-8 bg-${iconColor}-100 rounded-full flex items-center justify-center mx-auto mb-2`}>
              <Icon icon="lucide:mail" className={`w-4 h-4 text-${iconColor}-600`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Email Notification</h3>
            <p className="text-xs text-gray-600 mt-1">From: Your Event Team</p>
          </div>

          {/* Template Content */}
          <div 
            className="prose prose-xs max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayTemplate }}
          />

          {/* QR Code Section */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Icon icon="lucide:qr-code" className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-gray-700">QR Code</span>
              </div>
              
              {/* QR Code Placeholder */}
              <div className="inline-block bg-white border border-dashed border-gray-300 rounded p-3">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  <Icon icon="lucide:qr-code" className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isRegistrationForm ? 'Registration QR Code' : 'Custom QR Code'}
                </p>
                {!isRegistrationForm && displayQrCode && (
                  <div 
                    className="text-xs text-gray-600 mt-1 font-mono"
                    dangerouslySetInnerHTML={{ __html: displayQrCode }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Email Footer */}
          <div className="mt-3 pt-2 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Automated email notification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  
  const formId = params.formId as string;
  const eventId = params.id as string;
  
  const [emailTemplate, setEmailTemplate] = useState('');
  const [qrCodeContent, setQrCodeContent] = useState('');
  const [groupEmailTemplate, setGroupEmailTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Get form data
  const { data: formData, isLoading, error, refetch } = useForm(formId);
  
  // Get form fields for template editor
  const fields = formData?.fields || [];

  // Initialize email template and QR code content when form data loads
  useEffect(() => {
    if (formData?.template_email) {
      // Convert from ${fieldId} format to {fieldName} format for display
      const displayEmailTemplate = formData.template_email.replace(
        /\$\{([^}]+)\}/g,
        (match, fieldId) => {
          const field = fields.find((f: any) => f.id === fieldId);
          if (field) {
            const fieldLabel = Array.isArray(field.translations) 
              ? field.translations.find((t: any) => t.languages_code === 'en-US')?.label 
              : field.translations?.['en-US']?.label;
            return fieldLabel ? `{${fieldLabel}}` : match;
          }
          return match;
        }
      );
      setEmailTemplate(displayEmailTemplate);
    }
    
    // Initialize QR code content - convert from ${fieldId} to {fieldName} format
    // Only load QR code content for non-registration forms
    if (formData?.qr_code_field && !formData?.is_registration) {
      const displayQrCodeContent = formData.qr_code_field.replace(
        /\$\{([^}]+)\}/g,
        (match, fieldId) => {
          const field = fields.find((f: any) => f.id === fieldId);
          if (field) {
            const fieldLabel = Array.isArray(field.translations) 
              ? field.translations.find((t: any) => t.languages_code === 'en-US')?.label 
              : field.translations?.['en-US']?.label;
            return fieldLabel ? `{${fieldLabel}}` : match;
          }
          return match;
        }
      );
      setQrCodeContent(displayQrCodeContent);
    }
    
    // Initialize group email template - convert from ${fieldId} to {fieldName} format
    if (formData?.template_email_group) {
      const displayGroupEmailTemplate = formData.template_email_group.replace(
        /\$\{([^}]+)\}/g,
        (match, fieldId) => {
          const field = fields.find((f: any) => f.id === fieldId);
          if (field) {
            const fieldLabel = Array.isArray(field.translations) 
              ? field.translations.find((t: any) => t.languages_code === 'en-US')?.label 
              : field.translations?.['en-US']?.label;
            return fieldLabel ? `{${fieldLabel}}` : match;
          }
          return match;
        }
      );
      setGroupEmailTemplate(displayGroupEmailTemplate);
    }
  }, [formData, fields]);

  // Save email template mutation
  const saveEmailTemplateMutation = useUpdateEmailTemplate();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert from {fieldName} format to ${fieldId} format for saving
      const directusTemplate = emailTemplate.replace(
        /\{([^}]+)\}/g,
        (match, fieldName) => {
          const field = fields.find((f: any) => {
            const fieldLabel = Array.isArray(f.translations) 
              ? f.translations.find((t: any) => t.languages_code === 'en-US')?.label 
              : f.translations?.['en-US']?.label;
            return fieldLabel === fieldName || f.name === fieldName;
          });
          return field ? `\${${field.id}}` : match;
        }
      );

      // Convert QR code content from {fieldName} format to ${fieldId} format for saving
      // Only save QR code content for non-registration forms
      let directusQrCode = '';
      if (!formData?.is_registration) {
        directusQrCode = qrCodeContent.replace(
          /\{([^}]+)\}/g,
          (match, fieldName) => {
            const field = fields.find((f: any) => {
              const fieldLabel = Array.isArray(f.translations) 
                ? f.translations.find((t: any) => t.languages_code === 'en-US')?.label 
                : f.translations?.['en-US']?.label;
              return fieldLabel === fieldName || f.name === fieldName;
            });
            return field ? `\${${field.id}}` : match;
          }
        );
      }

      // Convert group email template from {fieldName} format to ${fieldId} format for saving
      const directusGroupTemplate = groupEmailTemplate.replace(
        /\{([^}]+)\}/g,
        (match, fieldName) => {
          const field = fields.find((f: any) => {
            const fieldLabel = Array.isArray(f.translations) 
              ? f.translations.find((t: any) => t.languages_code === 'en-US')?.label 
              : f.translations?.['en-US']?.label;
            return fieldLabel === fieldName || f.name === fieldName;
          });
          return field ? `\${${field.id}}` : match;
        }
      );

      await saveEmailTemplateMutation.mutateAsync({
        formId,
        templateEmail: directusTemplate,
        qrCodeField: !formData?.is_registration ? directusQrCode : undefined,
        templateEmailGroup: directusGroupTemplate,
      });
      
      toast.success('Email template and QR code configuration saved successfully!');
    } catch (error) {
      toast.error(`Failed to save email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/events/${eventId}/forms/${formId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-content-secondary">Loading form data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Icon icon="lucide:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">Failed to load form</h3>
          <p className="text-content-secondary mb-4">Unable to load form data for email template configuration.</p>
          <Button onClick={handleBack} variant="outline">
            <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
            Back to Form Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <ContainerHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            {/* <Button 
              onClick={handleBack}
              variant="outline"
              size="sm"
            >
              <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
              Back
            </Button> */}
            <div>
              <h1 className="text-xl font-bold text-content-primary">Email Template Configuration</h1>
              <p className="text-content-secondary text-sm mt-1">
                Form: {formData?.translations?.[0]?.title || 'Untitled Form'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="gradient"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </ContainerHeader>

      {/* Content */}
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon icon="lucide:info" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Email Template Configuration</p>
                <p>
                  Configure the automatic email template that will be sent when this form is submitted. 
                  Use the toolbar below to insert form fields into your template.
                </p>
              </div>
            </div>
          </div>

          {/* Email Template Editor */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Icon icon="lucide:mail" className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-content-primary">Email Template</h3>
                  <p className="text-sm text-content-secondary mt-1">
                    Design your email template. Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">${'{'}</code> to insert form fields.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <EmailTemplateEditor
                value={emailTemplate}
                onChange={setEmailTemplate}
                formFields={fields}
                className="w-full"
              />
              
              {/* Email Template Preview */}
              <TemplatePreview
                template={emailTemplate}
                qrCodeContent={qrCodeContent}
                isRegistrationForm={!!formData?.is_registration}
                title="Email Template"
                icon="lucide:mail"
                iconColor="blue"
              />
            </div>
          </div>

          {/* QR Code Configuration - Only show for non-registration forms */}
          {!formData?.is_registration && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Icon icon="lucide:qr-code" className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-content-primary">QR Code Configuration</h3>
                    <p className="text-sm text-content-secondary mt-1">
                      Configure the content that will be encoded in the QR code. Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{'{'}</code> to insert form fields or type custom content.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-content-primary mb-2">
                      QR Code Content Template
                    </label>
                    
                    {/* Text Area for QR Code Content */}
                    <textarea
                      value={qrCodeContent}
                      onChange={(e) => setQrCodeContent(e.target.value)}
                      placeholder="Enter QR code content template. Use {Field Name} for form fields..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm font-mono"
                    />
                    
                    {/* Quick Insert Buttons */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-600">Quick insert:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const cursorPos = (document.querySelector('textarea') as HTMLTextAreaElement)?.selectionStart || 0;
                            const newContent = qrCodeContent.slice(0, cursorPos) + '{ID Record}' + qrCodeContent.slice(cursorPos);
                            setQrCodeContent(newContent);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors"
                        >
                          <Icon icon="lucide:hash" className="w-3 h-3 mr-1 inline" />
                          ID Record
                        </button>
                        {fields.map((field: any) => {
                          const fieldLabel = Array.isArray(field.translations) 
                            ? field.translations.find((t: any) => t.languages_code === 'en-US')?.label 
                            : field.translations?.['en-US']?.label;
                          const label = fieldLabel || field.name || field.id;
                          
                          return (
                            <button
                              key={field.id}
                              type="button"
                              onClick={() => {
                                const cursorPos = (document.querySelector('textarea') as HTMLTextAreaElement)?.selectionStart || 0;
                                const newContent = qrCodeContent.slice(0, cursorPos) + `{${label}}` + qrCodeContent.slice(cursorPos);
                                setQrCodeContent(newContent);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
                            >
                              <Icon 
                                icon={
                                  field.type === 'email' ? 'lucide:mail' :
                                  field.type === 'phone' ? 'lucide:phone' :
                                  field.type === 'number' ? 'lucide:hash' :
                                  'lucide:file-text'
                                } 
                                className="w-3 h-3 mr-1 inline" 
                              />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Preview */}
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon icon="lucide:eye" className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Preview:</span>
                      </div>
                      <div className="text-sm text-gray-600 font-mono bg-white rounded border p-2">
                        {qrCodeContent || 'No content configured'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form Info */}
          {formData?.is_registration && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Icon icon="lucide:info" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Registration Form</p>
                  <p>
                    This is a registration form. QR codes will be automatically generated using the registration ID 
                    and do not require manual configuration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Group Email Template Configuration - Only show if form allows groups */}
          {formData?.is_allow_group && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Icon icon="lucide:users" className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-content-primary">Group Email Template</h3>
                    <p className="text-sm text-content-secondary mt-1">
                      Configure the email template that will be sent for group registrations. Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{'{'}</code> to insert form fields.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <EmailTemplateEditor
                  value={groupEmailTemplate}
                  onChange={setGroupEmailTemplate}
                  formFields={fields}
                  className="w-full"
                />
                
                {/* Group Email Template Preview */}
                <TemplatePreview
                  template={groupEmailTemplate}
                  qrCodeContent={qrCodeContent}
                  isRegistrationForm={!!formData?.is_registration}
                  title="Group Email Template"
                  icon="lucide:users"
                  iconColor="purple"
                />
              </div>
            </div>
          )}
        </motion.div>
      </Container>

      {/* Custom CSS for field placeholders */}
      <style jsx>{`
        .field-placeholder {
          background: #e3f2fd;
          color: #1976d2;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
          font-weight: 500;
          border: 1px solid #bbdefb;
          display: inline-block;
          margin: 0 2px;
        }
      `}</style>
    </div>
  );
}
