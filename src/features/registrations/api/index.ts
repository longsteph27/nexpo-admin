import { directusHelpers } from '@/lib/directus';
import type { RegistrationsResponse, Registration } from '../types';

interface ListOptions {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

interface CountOptions {
  status?: 'checkedIn' | 'pending';
  search?: string;
}

export const registrationsApi = {
  async getRegistrations(eventId: number, options?: ListOptions) {
    return directusHelpers.getRegistrationsByEvent(eventId, options);
  },

  async countRegistrations(eventId: number, options?: CountOptions) {
    return directusHelpers.countRegistrationsByEvent(eventId, options);
  },

  async getRegistrationById(registrationId: string) {
    return directusHelpers.getRegistrationById(registrationId);
  },

  async getRegistration(registrationId: string) {
    return directusHelpers.getRegistrationById(registrationId);
  },

  async updateRegistration(registrationId: string, data: Partial<Registration>) {
    return directusHelpers.updateRegistration(registrationId, data);
  },

  async getRegistrationIdsForCheckin(eventId: number, tenantId: number, qrCodeId: string) {
    return directusHelpers.getRegistrationIdsForCheckin(eventId, tenantId, qrCodeId);
  },

  async bulkUpdateRegistrations(registrationIds: string[], data: Record<string, unknown>) {
    return directusHelpers.updateRegistrations(registrationIds, data);
  },
};


