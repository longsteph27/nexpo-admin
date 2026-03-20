'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { EmailTemplateEditor, useForm, useUpdateEmailTemplate } from '@/features/forms';
import { useEvent } from '@/features/events/hooks/useEvents';
import type { Form, FormField } from '@/features/forms';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';

// Reusable "Insert Field" dropdown for plain text inputs
function FieldInsertDropdown({
  fields,
  onInsert,
  extraItems,
}: {
  fields: { id: string; label: string }[];
  onInsert: (tag: string) => void;
  extraItems?: { label: string; tag: string; className?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (fields.length === 0 && !extraItems?.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <Icon icon="lucide:variable" className="w-3.5 h-3.5" />
        Insert Field
        <Icon icon="lucide:chevron-down" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1">
          {extraItems?.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => { onInsert(item.tag); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-blue-50 hover:text-blue-700 ${item.className ?? 'text-gray-700'}`}
            >
              <Icon icon="lucide:globe" className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
              {item.label}
            </button>
          ))}
          {extraItems && extraItems.length > 0 && fields.length > 0 && (
            <div className="border-t border-gray-100 my-1" />
          )}
          {fields.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => { onInsert(`{${f.label}}`); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors"
            >
              <Icon icon="lucide:file-text" className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Template Preview Component
function TemplatePreview({
  template,
  qrCodeContent,
  isRegistrationForm,
  title,
  icon,
  iconColor = "blue",
  senderName = "Nexpo",
  fieldMap = {},
}: {
  template: string;
  qrCodeContent: string;
  isRegistrationForm: boolean;
  title: string;
  icon: string;
  iconColor?: string;
  senderName?: string;
  fieldMap?: Record<string, string>; // uuid → label
}) {
  const hasEmbeddedQr = template.includes('cid:qrcode.png');

  // Replace ${uuid} and {uuid} with labelled pill spans
  const convertTemplateToDisplay = (tmpl: string) => {
    return tmpl
      // Replace cid:qrcode.png img tag with a visual QR placeholder at the right position
      .replace(/<img[^>]*src=["']cid:qrcode\.png["'][^>]*\/?>/gi,
        `<div style="text-align:center;padding:12px 0;">` +
        `<div style="display:inline-block;border:1px dashed #9ca3af;border-radius:8px;padding:12px;background:#f9fafb;">` +
        `<div style="width:64px;height:64px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto;">&#x2611;</div>` +
        `<div style="font-size:11px;color:#6b7280;margin-top:4px;">QR Code</div>` +
        `</div></div>`
      )
      // Replace ${uuid}<!-- label --> (annotated by "Add Labels")
      .replace(/\$\{([^}]+)\}<!--[^>]*-->/g, (_m, id) => {
        const label = fieldMap[id] || id;
        return `<span class="field-placeholder">${label}</span>`;
      })
      // Replace plain ${uuid}
      .replace(/\$\{([^}]+)\}/g, (_m, id) => {
        const label = fieldMap[id] || id;
        return `<span class="field-placeholder">${label}</span>`;
      })
      // Replace {anything} (visual mode / special vars like {event_name})
      .replace(/\{([^}]+)\}/g, (_m, name) => {
        return `<span class="field-placeholder">${name}</span>`;
      });
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
            <p className="text-xs text-gray-600 mt-1">From: {senderName} &lt;no-reply@m.nexpo.vn&gt;</p>
          </div>

          {/* Template Content */}
          <div 
            className="prose prose-xs max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayTemplate }}
          />

          {/* QR Code Section — only show if template does NOT already embed cid:qrcode.png */}
          {!hasEmbeddedQr && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Icon icon="lucide:qr-code" className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">QR Code</span>
                  <span className="text-xs text-gray-400">(auto-appended at end)</span>
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
          )}

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
  const formId = params.formId as string;
  const eventId = params.id as string;
  
  const [emailTemplate, setEmailTemplate] = useState('');
  const [qrCodeContent, setQrCodeContent] = useState('');
  const [groupEmailTemplate, setGroupEmailTemplate] = useState('');
  const [emailSenderName, setEmailSenderName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const senderNameRef = useRef<HTMLInputElement>(null);
  const emailSubjectRef = useRef<HTMLInputElement>(null);

  // Get form + event data
  const { data: formData, isLoading, error } = useForm(formId);
  const form = formData as Form | null;
  const fields = useMemo<FormField[]>(() => form?.fields ?? [], [form]);
  const { data: eventData } = useEvent(eventId);
  const eventName = (eventData as any)?.name ?? '';

  const textFields = useMemo(
    () => fields.filter((f) => !['file', 'image', 'upload'].includes(f.type ?? '')),
    [fields]
  );

  const getFieldLabel = useCallback((field: FormField): string => {
    const translation = field.translations?.find((t) => t.languages_code === 'en-US') ?? field.translations?.[0];
    if (translation && typeof translation.label === 'string' && translation.label.trim().length > 0) {
      return translation.label;
    }
    return field.name || field.id;
  }, []);

  const textFieldOptions = useMemo(
    () => textFields.map((f) => ({ id: f.id, label: getFieldLabel(f) })),
    [textFields, getFieldLabel]
  );

  // uuid → label map for TemplatePreview
  const fieldMap = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.id, getFieldLabel(f)])),
    [fields, getFieldLabel]
  );

  const insertAtCursor = useCallback((
    inputRef: React.RefObject<HTMLInputElement>,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    tag: string
  ) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const next = value.slice(0, start) + tag + value.slice(end);
      setValue(next);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      setValue((prev) => prev + tag);
    }
  }, []);

  // Initialize email template and QR code content when form data loads
  useEffect(() => {
    if (!form) {
      setEmailTemplate('');
      setQrCodeContent('');
      setGroupEmailTemplate('');
      return;
    }

    const decodeVars = (str: string) =>
      str.replace(/\$\{([^}]+)\}/g, (_m, fieldId) => {
        const field = fields.find((f) => f.id === fieldId);
        return field ? `{${getFieldLabel(field)}}` : `{${fieldId}}`;
      });
    setEmailSenderName(decodeVars(form.email_sender_name || ''));
    setEmailSubject(decodeVars(form.email_subject || ''));

    if (form.template_email) {
      const displayEmailTemplate = form.template_email.replace(
        /\$\{([^}]+)\}/g,
        (_match: string, fieldId: string) => {
          const field = fields.find((f) => f.id === fieldId);
          const label = field ? getFieldLabel(field) : fieldId;
          return `{${label}}`;
        }
      );
      const htmlContent = displayEmailTemplate.replace(
        /\{([^}]+)\}/g,
        (_match: string, fieldName: string) => {
          const field = fields.find((f) => getFieldLabel(f) === fieldName);
          const fieldId = field ? field.id : fieldName;
          return `<span class="form-field-tag" data-field-id="${fieldId}">${fieldName}</span>`;
        }
      );
      setEmailTemplate(htmlContent);
    } else {
      setEmailTemplate('');
    }

    if (form.qr_code_field && !form.is_registration) {
      const displayQrCodeContent = form.qr_code_field.replace(
        /\$\{([^}]+)\}/g,
        (_match: string, fieldId: string) => {
          const field = fields.find((f) => f.id === fieldId);
          const label = field ? getFieldLabel(field) : fieldId;
          return `{${label}}`;
        }
      );
      const htmlContent = displayQrCodeContent.replace(
        /\{([^}]+)\}/g,
        (_match: string, fieldName: string) => {
          const field = fields.find((f) => getFieldLabel(f) === fieldName);
          const fieldId = field ? field.id : fieldName;
          return `<span class="form-field-tag" data-field-id="${fieldId}">${fieldName}</span>`;
        }
      );
      setQrCodeContent(htmlContent);
    } else {
      setQrCodeContent('');
    }

    if (form.template_email_group) {
      const displayGroupEmailTemplate = form.template_email_group.replace(
        /\$\{([^}]+)\}/g,
        (_match: string, fieldId: string) => {
          const field = fields.find((f) => f.id === fieldId);
          const label = field ? getFieldLabel(field) : fieldId;
          return `{${label}}`;
        }
      );
      const htmlContent = displayGroupEmailTemplate.replace(
        /\{([^}]+)\}/g,
        (_match: string, fieldName: string) => {
          const field = fields.find((f) => getFieldLabel(f) === fieldName);
          const fieldId = field ? field.id : fieldName;
          return `<span class="form-field-tag" data-field-id="${fieldId}">${fieldName}</span>`;
        }
      );
      setGroupEmailTemplate(htmlContent);
    } else {
      setGroupEmailTemplate('');
    }
  }, [form, fields, getFieldLabel]);

  // Save email template mutation
  const saveEmailTemplateMutation = useUpdateEmailTemplate();

  const handleSave = async () => {
    if (!form) {
      toast.error('Form data is not available yet.');
      return;
    }

    setIsSaving(true);
    try {
      // Convert from {fieldName} format to ${fieldId} format for saving
      const directusTemplate = emailTemplate.replace(/\{([^}]+)\}/g, (_match: string, fieldName: string) => {
        const field = fields.find((f) => getFieldLabel(f) === fieldName || f.name === fieldName);
        return field ? `\${${field.id}}` : _match;
      });

      // Convert QR code content from {fieldName} format to ${fieldId} format for saving
      // Only save QR code content for non-registration forms
      let directusQrCode = '';
      if (!form.is_registration) {
        directusQrCode = qrCodeContent.replace(/\{([^}]+)\}/g, (_match: string, fieldName: string) => {
          const field = fields.find((f) => getFieldLabel(f) === fieldName || f.name === fieldName);
          return field ? `\${${field.id}}` : _match;
        });
      }

      // Convert group email template from {fieldName} format to ${fieldId} format for saving
      const directusGroupTemplate = groupEmailTemplate.replace(/\{([^}]+)\}/g, (_match: string, fieldName: string) => {
        const field = fields.find((f) => getFieldLabel(f) === fieldName || f.name === fieldName);
        return field ? `\${${field.id}}` : _match;
      });

      // Encode {Label} → ${fieldId}, preserve special vars like {event_name}
      const encodeVars = (str: string) =>
        str.replace(/\{([^}]+)\}/g, (_match, name) => {
          const field = fields.find((f) => getFieldLabel(f) === name || f.name === name);
          return field ? `\${${field.id}}` : `{${name}}`;
        });

      await saveEmailTemplateMutation.mutateAsync({
        formId,
        templateEmail: directusTemplate,
        qrCodeField: !form.is_registration ? directusQrCode : undefined,
        templateEmailGroup: directusGroupTemplate,
        emailSenderName: emailSenderName ? encodeVars(emailSenderName) : undefined,
        emailSubject: emailSubject ? encodeVars(emailSubject) : undefined,
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
                Form: {form?.translations?.[0]?.title || 'Untitled Form'}
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

          {/* Email Settings: Sender Name + Subject */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Icon icon="lucide:settings-2" className="w-5 h-5 text-slate-600" />
                <div>
                  <h3 className="text-lg font-semibold text-content-primary">Email Settings</h3>
                  <p className="text-sm text-content-secondary mt-1">
                    Configure sender name and subject. Click field chips to insert variables.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sender Name */}
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1.5">
                  Sender Name
                </label>
                <div className="flex gap-2">
                  <input
                    ref={senderNameRef}
                    type="text"
                    value={emailSenderName}
                    onChange={(e) => setEmailSenderName(e.target.value)}
                    placeholder="e.g. Nexpo Team, Job Fair 2026"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <FieldInsertDropdown
                    fields={textFieldOptions}
                    onInsert={(tag) => insertAtCursor(senderNameRef, emailSenderName, setEmailSenderName, tag)}
                  />
                </div>
                <p className="mt-1.5 text-xs text-content-tertiary">
                  Shown as <span className="font-mono">{emailSenderName || 'Nexpo'} &lt;no-reply@m.nexpo.vn&gt;</span>
                </p>
              </div>

              {/* Email Subject */}
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1.5">
                  Email Subject
                </label>
                <div className="flex gap-2">
                  <input
                    ref={emailSubjectRef}
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Registration Confirmation | {event_name}"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <FieldInsertDropdown
                    fields={textFieldOptions}
                    extraItems={[{ label: 'Event Name', tag: '{event_name}' }]}
                    onInsert={(tag) => insertAtCursor(emailSubjectRef, emailSubject, setEmailSubject, tag)}
                  />
                </div>
                <p className="mt-1.5 text-xs text-content-tertiary">
                  Leave blank to use default: <span className="font-mono">Registration Confirmation | {'{event_name}'}</span>
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
                eventName={eventName}
                className="w-full"
              />
              
              {/* Email Template Preview */}
              <TemplatePreview
                template={emailTemplate}
                qrCodeContent={qrCodeContent}
                isRegistrationForm={!!form?.is_registration}
                title="Email Template"
                icon="lucide:mail"
                iconColor="blue"
                senderName={emailSenderName || 'Nexpo'}
                fieldMap={fieldMap}
              />
            </div>
          </div>

          {/* QR Code Configuration - Only show for non-registration forms */}
          {!form?.is_registration && (
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
                        {fields.map((field) => {
                          const label = getFieldLabel(field);

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
          {form?.is_registration && (
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

          {/* Insight Hub Button — for registration forms */}
          {form?.is_registration && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Icon icon="lucide:layout-dashboard" className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-content-primary">Insight Hub Button</h3>
                    <p className="text-sm text-content-secondary mt-1">
                      Insert a CTA button that links each registrant to their personal Insight Hub page.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-content-secondary">
                  The button links to{' '}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                    insight.nexpo.vn/{'{registration_id}'}
                  </code>{' '}
                  — resolved automatically per registrant when the email is sent.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const html =
                        `<div style="text-align:center;margin:28px 0;">` +
                        `<a href="https://insight.nexpo.vn/{registration_id}" ` +
                        `style="display:inline-block;background:#1313ec;color:#ffffff;` +
                        `padding:14px 36px;border-radius:10px;font-size:16px;font-weight:700;` +
                        `text-decoration:none;letter-spacing:0.01em;">` +
                        `Truy cập Insight Hub →` +
                        `</a></div>`;
                      setEmailTemplate((prev) => prev + html);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    <Icon icon="lucide:plus-circle" className="w-4 h-4" />
                    Insert Insight Hub Button
                  </button>
                  <span className="text-xs text-content-tertiary">appended to current email template</span>
                </div>
                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
                  <span className="inline-block bg-[#1313ec] text-white px-8 py-3 rounded-[10px] text-sm font-bold pointer-events-none">
                    Truy cập Insight Hub →
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Group Email Template Configuration - Only show if form allows groups */}
          {form?.is_allow_group && (
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
                  eventName={eventName}
                  className="w-full"
                />
                
                {/* Group Email Template Preview */}
                <TemplatePreview
                  template={groupEmailTemplate}
                  qrCodeContent={qrCodeContent}
                  isRegistrationForm={!!form?.is_registration}
                  title="Group Email Template"
                  icon="lucide:users"
                  iconColor="purple"
                  senderName={emailSenderName || 'Nexpo'}
                  fieldMap={fieldMap}
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
