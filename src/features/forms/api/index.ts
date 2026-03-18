import { directusHelpers } from '@/lib/directus';
import { handleAxiosError } from '@/lib/utils/errorHandler';
import type { Form, FormField, FormPayload, FormSummary } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Forms API
export const formsApi = {
  /**
   * Get forms by event ID
   */
  getFormsByEvent: async (eventId: string): Promise<ApiResponse<FormSummary[]>> => {
    try {
      const res = await directusHelpers.getAllFormsByEvent(Number(eventId));
      if (!res.success) {
        return { success: false, error: res.error };
      }
      return { success: true, data: (res.data as FormSummary[] | undefined) ?? [] };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to get forms by event')
      };
    }
  },

  /**
   * Get single form by ID
   */
  getForm: async (formId: string): Promise<ApiResponse<Form | null>> => {
    try {
      const res = await directusHelpers.getForm(formId);
      return res.success
        ? { success: true, data: (res.data as Form | null) ?? null }
        : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to get form')
      };
    }
  },

  /**
   * Save form (basic form data only)
   */
  saveForm: async (formId: string, eventId: string, formData: unknown): Promise<ApiResponse<Form>> => {
    try {
      const res = await directusHelpers.saveForm(formId, eventId, formData as never);
      return res.success
        ? { success: true, data: res.data as Form }
        : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to save form')
      };
    }
  },

  /**
   * Save form with fields (includes form fields and translations)
   */
  saveFormWithFields: async (
    formId: string, 
    eventId: string, 
    tenantId: number, 
    formData: FormPayload
  ): Promise<ApiResponse<Form>> => {
    try {
      const res = await directusHelpers.saveFormWithFields(formId, eventId, tenantId, formData as never);
      return res.success
        ? { success: true, data: res.data as Form }
        : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to save form with fields')
      };
    }
  },

  /**
   * Create new form
   */
  createForm: async (
    eventId: string, 
    tenantId: number, 
    formData: Partial<FormPayload>
  ): Promise<ApiResponse<Form>> => {
    try {
      const res = await directusHelpers.createForm({ 
        ...formData,
        event_id: Number(eventId),
        tenant_id: tenantId
      });
      return res.success
        ? { success: true, data: res.data as Form }
        : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to create form')
      };
    }
  },

  /**
   * Get registration forms for an event
   */
  getRegistrationForms: async (eventId: number, tenantId: number): Promise<ApiResponse<FormSummary[]>> => {
    try {
      const res = await directusHelpers.getRegistrationForms(eventId, tenantId);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      return { success: true, data: (res.data as FormSummary[] | undefined) ?? [] };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to get registration forms')
      };
    }
  },

  /**
   * Get other forms (non-registration) for an event
   */
  getOtherForms: async (eventId: number, tenantId: number): Promise<ApiResponse<FormSummary[]>> => {
    try {
      const res = await directusHelpers.getOtherForms(eventId, tenantId);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      return { success: true, data: (res.data as FormSummary[] | undefined) ?? [] };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to get other forms')
      };
    }
  },

  /**
   * Get form fields by form ID
   */
  getFormFields: async (formId: string): Promise<ApiResponse<FormField[]>> => {
    try {
      const res = await directusHelpers.getFormFields(formId);
      return res.success
        ? { success: true, data: (res.data as FormField[] | undefined) ?? [] }
        : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to get form fields')
      };
    }
  },

  /**
   * Update email template
   */
  updateEmailTemplate: async (
    formId: string,
    templateEmail?: string,
    qrCodeField?: string,
    templateEmailGroup?: string,
    emailSenderName?: string,
    emailSubject?: string
  ): Promise<ApiResponse<Form>> => {
    try {
      console.log('[updateEmailTemplate] Updating email template for formId:', formId);

      const updateData: any = {};
      if (templateEmail !== undefined) {
        updateData.template_email = templateEmail;
      }
      if (qrCodeField !== undefined) {
        updateData.qr_code_field = qrCodeField;
      }
      if (templateEmailGroup !== undefined) {
        updateData.template_email_group = templateEmailGroup;
      }
      if (emailSenderName !== undefined) {
        updateData.email_sender_name = emailSenderName;
      }
      if (emailSubject !== undefined) {
        updateData.email_subject = emailSubject;
      }

      const result = await directusHelpers.updateFormTemplate(formId, updateData);
      
      if (result.success) {
        console.log('[updateEmailTemplate] Success:', result.data);
        return { success: true, data: result.data as Form };
      }
      
      return { success: false, error: result.error || 'Failed to update email template' };
    } catch (error: unknown) {
      console.error('[updateEmailTemplate] Error:', error);
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to update email template')
      };
    }
  }
};
