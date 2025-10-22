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

export default function EmailTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  
  const formId = params.formId as string;
  const eventId = params.id as string;
  
  const [emailTemplate, setEmailTemplate] = useState('');
  const [qrCodeContent, setQrCodeContent] = useState('');
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
    if (formData?.qr_code_field) {
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
      const directusQrCode = qrCodeContent.replace(
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
        qrCodeField: directusQrCode,
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
            </div>
          </div>

          {/* QR Code Configuration */}
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

          {/* Preview Card */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="lucide:eye" className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Template Preview</span>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Subject:</strong> Form Submission Notification
              </p>
              <p className="mb-2">
                <strong>From:</strong> Your Form System
              </p>
              <div className="bg-white border border-gray-200 rounded p-3 text-xs">
                <div className="whitespace-pre-wrap">
                  {emailTemplate || 'Your email template will appear here...'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
