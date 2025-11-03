import type { Event, User, Permission } from './directus';
import directus, { directusHelpers } from './directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

// Directus URL constant
// const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

// Helper function to handle axios errors
const handleAxiosError = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as { response?: { data?: { message?: string } } };
  return axiosError.response?.data?.message || defaultMessage;
};

// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DirectusAuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires?: number;
  expires_in?: number;
}

// Authentication API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<DirectusAuthResponse>> => {
    const res = await directusHelpers.login(email, password);
    return res.success ? { success: true, data: res.data as unknown as DirectusAuthResponse } : { success: false, error: res.error };
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<DirectusAuthResponse>> => {
    try {
      const res = await directusHelpers.refresh(refreshToken);
      return res.success ? { success: true, data: res.data as DirectusAuthResponse } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Token refresh failed') };
    }
  },

  logout: async (): Promise<ApiResponse> => {
    const res = await directusHelpers.logout();
    return res.success ? { success: true } : { success: false, error: res.error };
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const res = await directusHelpers.getCurrentUser();
    return res.success ? { success: true, data: res.data as unknown as User } : { success: false, error: res.error };
  },

  getUserPermissions: async (): Promise<ApiResponse<Record<string, Permission>>> => {
    const res = await directusHelpers.getUserPermissions();
    return res.success ? { success: true, data: res.data as unknown as Record<string, Permission> } : { success: false, error: res.error };
  }
};

// Events API
export const eventsApi = {
  getEvents: async (
    tenantId: string,
    status?: string,
    fields?: (keyof Event)[]
  ): Promise<ApiResponse<Event[]>> => {
    try {
      const params: Record<string, unknown> = {
        filter: {
          tenant_id: {
            _eq: tenantId
          }
        }
      };

      if (status) {
        (params.filter as Record<string, unknown>).status = { _eq: status };
      }

      if (fields) {
        // Include forms relationship like in the original SDK
        params.fields = [...fields, 'forms.id'].join(',');
      } else {
        // Default fields like in the original SDK
        params.fields = '*,tenant.id,tenant.name,tenant.logo,tenant.status,forms.id';
      }

      // Add sort parameter like in the original SDK
      params.sort = '-start_date';

      const res = await directusHelpers.getEvents(Number(tenantId), status ? { status: { _eq: status } } : undefined, fields);
      return res.success ? { success: true, data: res.data as Event[] } : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to get events')
      };
    }
  },

  getEvent: async (eventId: string): Promise<ApiResponse<Event>> => {
    try {
      const res = await directusHelpers.getEvent(eventId);
      return res.success ? { success: true, data: res.data as Event } : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to get event')
      };
    }
  },

  createEvent: async (eventData: Partial<Event>): Promise<ApiResponse<Event>> => {
    try {
      const res = await directusHelpers.createEvent(eventData as never);
      return res.success ? { success: true, data: res.data as Event } : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to create event')
      };
    }
  },

  updateEvent: async (eventId: string, eventData: Partial<Event>): Promise<ApiResponse<Event>> => {
    try {
      const res = await directusHelpers.updateEvent(eventId, eventData);
      return res.success ? { success: true, data: res.data as Event } : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to update event')
      };
    }
  },

  deleteEvent: async (eventId: string): Promise<ApiResponse> => {
    try {
      const res = await directusHelpers.deleteEvent(eventId);
      return res.success ? { success: true } : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to delete event')
      };
    }
  }
};

// Re-export Forms API from dedicated file
export { formsApi } from '@/lib/api/forms';

// Site Builder API: site (one per event), pages, blocks
export const siteApi = {
  getSiteByEvent: async (eventId: string): Promise<ApiResponse<{ id: number } | null>> => {
    try {
      const res = await directusHelpers.getSiteByEvent(Number(eventId));
      return res.success ? { success: true, data: res.data as { id: number } | null } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get site by event') };
    }
  },

  getSitesList: async (eventId: number, tenantId?: number): Promise<ApiResponse<unknown[]>> => {
    try {
      const res = await directusHelpers.getSitesList(eventId, tenantId);
      return res.success ? { success: true, data: res.data as unknown[] } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get sites list') };
    }
  },

  getSite: async (siteId: number): Promise<ApiResponse<any>> => {
    try {
      const res = await directusHelpers.getSite(Number(siteId));
      return res.success ? { success: true, data: res.data } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get site') };
    }
  },

  // Create a site with minimal fields (event_id, slug/domain optional)
  createSite: async (payload: { event_id: number; slug?: string; domain?: string; status?: string }): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.createSite(payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to create site') };
    }
  },

  // Update site
  updateSite: async (siteId: number, payload: Partial<{
    slug: string;
    domain: string;
    status: string;
    logo: string | null;
    favicon: string | null;
    tenant_id: number;
    translations: {
      create?: Array<{ languages_code: { code: string }; title?: string; description?: string }>;
      update?: Array<{ id: number; title?: string; description?: string }>;
    };
  }>): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.updateSite(siteId, payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to update site') };
    }
  },

  // Create a page with translations (title) for a site
  createPage: async (payload: { site_id: number; sort?: number; translations?: { create: Array<{ languages_code: { code: string }; title?: string; permalink?: string }> } }): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.createPage(payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to create page') };
    }
  },
  getPagesBySite: async (siteId: number): Promise<ApiResponse<Array<{ id: string; translations?: { title?: string; permalink?: string }[] }>>> => {
    try {
      const res = await directusHelpers.getPagesBySite(siteId);
      return res.success ? { success: true, data: res.data as Array<{ id: string; translations?: { title?: string; permalink?: string }[] }> } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get pages') };
    }
  },

  getPage: async (pageId: string): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.getPage(pageId);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get page') };
    }
  },

  updatePage: async (pageId: string, payload: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.updatePage(pageId, payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to update page') };
    }
  },

  getBlocksByPage: async (pageId: string): Promise<ApiResponse<Array<{ id: string; collection: string; hide_block?: boolean }>>> => {
    try {
      const res = await directusHelpers.getBlocksByPage(pageId);
      return res.success ? { success: true, data: res.data as Array<{ id: string; collection: string; hide_block?: boolean }> } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get blocks') };
    }
  },

  // Save or update a page block entry in junction `page_blocks`
  upsertPageBlock: async (payload: { id?: string; pages_id: string; collection: string; item: Record<string, unknown>; sort?: number; hide_block?: boolean }): Promise<ApiResponse<unknown>> => {
    try {
      // 1) Create the block item in its collection
      const res = await directusHelpers.upsertPageBlock(payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to save block') };
    }
  },

  // Update page blocks using create/update/delete structure
  updatePageBlocks: async (pageId: string, payload: { blocks: { create: any[]; update: any[]; delete: string[] }; event_id?: number }): Promise<ApiResponse<unknown>> => {
    try {
      // Call Directus API to update page with blocks
      const response = await directus.request(
        updateItem('pages' as never, pageId as never, {
          blocks: payload.blocks,
          event_id: payload.event_id,
        } as never)
      );
      return { success: true, data: response as unknown };
    } catch (error: unknown) {
      console.error('[updatePageBlocks] Error:', error);
      return { success: false, error: handleAxiosError(error, 'Failed to update page blocks') };
    }
  },

  // Related collections API for blocks
  getRelatedItems: async (collection: string, template?: string): Promise<ApiResponse<Record<string, unknown>[]>> => {
    try {
      const fields = template ? template.replace(/\{\{(\w+)\}\}/g, '$1').split(',').join(',') : 'id,name,title';
      const items = await directus.request(readItems(collection as never, { fields: fields as never }));
      return { success: true, data: items as unknown as Record<string, unknown>[] };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, `Failed to get ${collection} items`) };
    }
  },

  createRelatedItem: async (collection: string, data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const created = await directus.request(createItem(collection as never, data as never));
      return { success: true, data: created as unknown as Record<string, unknown> };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, `Failed to create ${collection} item`) };
    }
  },

  updateRelatedItem: async (collection: string, id: string, data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const updated = await directus.request(updateItem(collection as never, id as never, data as never));
      return { success: true, data: updated as unknown as Record<string, unknown> };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, `Failed to update ${collection} item`) };
    }
  },

  deleteRelatedItem: async (collection: string, id: string): Promise<ApiResponse<void>> => {
    try {
      await directus.request(deleteItem(collection as never, id as never));
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, `Failed to delete ${collection} item`) };
    }
  },

  // Navigation CRUD
  getNavigations: async (siteId: number): Promise<ApiResponse<Array<Record<string, unknown>>>> => {
    try {
      const res = await directusHelpers.getNavigation(siteId);
      // directusHelpers.getNavigation returns first; extend to full list when helper updated
      const data = res.data ? [res.data as Record<string, unknown>] : [];
      return res.success ? { success: true, data } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get navigation') };
    }
  },
  createNavItem: async (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const created = await directus.request(createItem('navigation' as never, payload as never));
      return { success: true, data: created as unknown as Record<string, unknown> };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to create navigation item') };
    }
  },
  updateNavItem: async (id: string | number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const updated = await directus.request(updateItem('navigation' as never, id as never, payload as never));
      return { success: true, data: updated as unknown as Record<string, unknown> };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to update navigation item') };
    }
  },
  deleteNavItem: async (id: string | number): Promise<ApiResponse<void>> => {
    try {
      await directus.request(deleteItem('navigation' as never, id as never));
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to delete navigation item') };
    }
  },

  // Navigation Items
  createNavigationItem: async (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const created = await directusHelpers.createNavigationItem(payload);
      return created.success ? { success: true, data: created.data as Record<string, unknown> } : { success: false, error: created.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to create navigation item') };
    }
  },
  updateNavigationItem: async (id: string | number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const updated = await directusHelpers.updateNavigationItem(String(id), payload);
      return updated.success ? { success: true, data: updated.data as Record<string, unknown> } : { success: false, error: updated.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to update navigation item') };
    }
  },
};

// Assets API
export const assetsApi = {
  uploadFile: async (file: File, folderId?: string, eventId?: string): Promise<ApiResponse<{ id: string }>> => {
    try {
      const res = await directusHelpers.uploadFile(file, folderId, eventId);
      return res.success ? { success: true, data: res.data as { id: string } } : { success: false, error: res.error };
    } catch (error: unknown) {
      return {
        success: false,
        error: handleAxiosError(error, 'Failed to upload file')
      };
    }
  },

  getAssetUrl: (assetId: string): string => {
    return `${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${assetId}`;
  }
};

// Navigation API
export const navigationApi = {
  getNavigations: async (siteId: number): Promise<ApiResponse<unknown[]>> => {
    try {
      const res = await directusHelpers.getNavigations(siteId);
      return res.success ? { success: true, data: res.data as unknown[] } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get navigations') };
    }
  },

  getNavigation: async (siteId: number): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.getNavigation(siteId);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get navigation') };
    }
  },

  updateNavigation: async (id: string, payload: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.updateNavigation(id, payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to update navigation') };
    }
  },

  createNavigation: async (payload: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.createNavigation(payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to create navigation') };
    }
  },

  createNavigationItem: async (payload: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.createNavigationItem(payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to create navigation item') };
    }
  },

  updateNavigationItem: async (id: string, payload: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.updateNavigationItem(id, payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to update navigation item') };
    }
  },

  deleteNavigationItem: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const res = await directusHelpers.deleteNavigationItem(id);
      return res.success ? { success: true } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to delete navigation item') };
    }
  },
};

// Global Settings API
export const globalApi = {
  getGlobal: async (siteId: number): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.getGlobal(siteId);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to get global settings') };
    }
  },

  updateGlobal: async (globalId: string, payload: Partial<{
    title: string;
    tagline: string;
    description: string;
    url: string;
    theme: Record<string, unknown>;
    logo_on_light_bg: string | null;
    logo_on_dark_bg: string | null;
    favicon: string | null;
    og_image: string | null;
    street_address: string;
    address_locality: string;
    address_region: string;
    address_country: string;
    postal_code: string;
    email: string;
    phone: string;
    social_links: Array<{ service: string; url: string }>;
    build_hook_url: string;
  }>): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.updateGlobal(globalId, payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to update global settings') };
    }
  },

  createGlobal: async (payload: {
    site_id: number;
    title?: string;
    tagline?: string;
    description?: string;
    url?: string;
    theme?: Record<string, unknown>;
  }): Promise<ApiResponse<unknown>> => {
    try {
      const res = await directusHelpers.createGlobal(payload);
      return res.success ? { success: true, data: res.data as unknown } : { success: false, error: res.error };
    } catch (error: unknown) {
      return { success: false, error: handleAxiosError(error, 'Failed to create global settings') };
    }
  },
};
