import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

// Schema types for Directus collections
export interface Schema {
  events: Event;
  users: User;
  directus_permissions: Permission;
  directus_roles: Role;
}

export interface Event {
  id: number;
  tenant_id?: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  status: 'draft' | 'published' | 'archived';
  sort?: number;
  event_users?: EventUser[];
  sites?: Site[];
  forms?: Form[];
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface EventUser {
  id: number;
  event_id: number;
  user_id: string;
  status: string;
}

export interface Site {
  id: number;
  domain: string;
  status: string;
}

export interface Form {
  id: string;
  title: string;
  status: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role?: string;
  status?: string;
  last_page?: string;
  location?: string;
  title?: string;
  description?: string;
  tags?: string[];
  language?: string;
  appearance?: string;
  theme_light?: string;
  theme_dark?: string;
  tfa_secret?: string;
}

export interface Permission {
  id: number;
  collection: string;
  action: 'create' | 'read' | 'update' | 'delete';
  fields?: string[];
  validation?: any;
  permissions?: any;
  presets?: any;
  policy?: string;
}

export interface Role {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  ip_access?: string[];
  enforce_tfa?: boolean;
  admin_access?: boolean;
  app_access?: boolean;
}

// Create Directus client
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

export const directus = createDirectus<Schema>(directusUrl)
  .with(rest())
  .with(authentication())
  .with(readMe());

export default directus;
