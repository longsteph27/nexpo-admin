import { directusHelpers } from '@/lib/directus';
import { handleAxiosError } from '@/lib/utils/errorHandler';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FormData {
  id?: string;
  status?: 'draft' | 'published' | 'archived';
  on_success?: 'redirect' | 'message';
  redirect_url?: string;
  event_id: number;
  tenant_id: number;
  translations?: {
    create?: any[];
    update?: any[];
    delete?: string[];
  };
  fields?: {
    create?: any[];
    update?: any[];
    delete?: string[];
  };
}

export interface FormField {
  id?: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string;
  conditions?: Record<string, unknown>;
  translations?: {
    'en-US'?: {
      id?: string;
      label?: string;
      placeholder?: string;
      help?: string;
      options?: { value: string; label: string }[];
    };
    'vi-VN'?: {
      id?: string;
      label?: string;
      placeholder?: string;
      help?: string;
      options?: { value: string; label: string }[];
    };
  };
}

export interface FormTranslation {
  id?: string;
  languages_code: string;
  title?: string;
  submit_label?: string;
  success_message?: string;
}

// Forms API
export const formsApi = {
  /**
   * Get forms by event ID
   */
  getFormsByEvent: async (eventId: string): Promise<ApiResponse<unknown[]>> => {
    try {
      const res = await directusHelpers.getAllFormsByEvent(Number(eventId));
      return res.success 
        ? { success: true, data: res.data || [] } 
        : { success: false, error: res.error };
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
  getForm: async (formId: string): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.getForm(formId);
      return res.success 
        ? { success: true, data: res.data } 
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
  saveForm: async (formId: string, eventId: string, formData: unknown): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.saveForm(formId, eventId, formData as never);
      return res.success 
        ? { success: true, data: res.data } 
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
    formData: FormData
  ): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.saveFormWithFields(formId, eventId, tenantId, formData as never);
      return res.success 
        ? { success: true, data: res.data } 
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
    formData: Partial<FormData>
  ): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.createForm({ 
        ...formData,
        event_id: Number(eventId),
        tenant_id: tenantId
      });
      return res.success 
        ? { success: true, data: res.data } 
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
  getRegistrationForms: async (eventId: number, tenantId: number): Promise<ApiResponse<unknown[]>> => {
    try {
      const res = await directusHelpers.getRegistrationForms(eventId, tenantId);
      return res.success 
        ? { success: true, data: res.data as unknown[] } 
        : { success: false, error: res.error };
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
  getOtherForms: async (eventId: number, tenantId: number): Promise<ApiResponse<unknown[]>> => {
    try {
      const res = await directusHelpers.getOtherForms(eventId, tenantId);
      return res.success 
        ? { success: true, data: res.data as unknown[] } 
        : { success: false, error: res.error };
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
        ? { success: true, data: res.data as FormField[] } 
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
  updateEmailTemplate: async (formId: string, templateEmail?: string, qrCodeField?: string): Promise<ApiResponse<any>> => {
    try {
      console.log('[updateEmailTemplate] Updating email template for formId:', formId);
      
      const updateData: any = {};
      if (templateEmail !== undefined) {
        updateData.template_email = templateEmail;
      }
      if (qrCodeField !== undefined) {
        updateData.qr_code_field = qrCodeField;
      }

      const result = await directusHelpers.updateFormTemplate(formId, updateData);
      
      if (result.success) {
        console.log('[updateEmailTemplate] Success:', result.data);
        return { success: true, data: result.data };
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
