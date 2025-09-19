import { directusAxios } from '@/lib/directus';

// Service function for safe API calls
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await apiCall();
  } catch (error) {
    console.error('Directus API Error:', error);
    return fallbackValue;
  }
}

// Collections
export async function getCollections(cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get('/collections', {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

export async function getCollectionById(id: string, cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get(`/collections/${id}`, {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

export async function getCollectionFields(collection: string, cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get(`/fields/${collection}`, {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

export async function getCollectionRelations(collection: string, cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get(`/relations`, {
      params: {
        filter: {
          collection: {
            _eq: collection
          }
        }
      },
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

// Fields
export async function getFields(cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get('/fields', {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

// Relations
export async function getRelations(cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get('/relations', {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

export async function getRelationsByCollection(collection: string, cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get('/relations', {
      params: {
        filter: {
          collection: {
            _eq: collection
          }
        }
      },
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

// User Management
export async function getCurrentUser(cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.get('/users/me', {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

// Items Management
export async function getItems(
  collection: string, 
  options: {
    fields?: string[];
    filter?: any;
    sort?: string[];
    limit?: number;
    offset?: number;
    search?: string;
  } = {},
  cookies?: string
) {
  return safeApiCall(async () => {
    const params: any = {};
    
    if (options.fields) params.fields = options.fields;
    if (options.filter) params.filter = options.filter;
    if (options.sort) params.sort = options.sort;
    if (options.limit) params.limit = options.limit;
    if (options.offset) params.offset = options.offset;
    if (options.search) params.search = options.search;

    const response = await directusAxios.get(`/items/${collection}`, {
      params,
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data;
  });
}

export async function getItemById(
  collection: string, 
  id: string | number, 
  options: {
    fields?: string[];
  } = {},
  cookies?: string
) {
  return safeApiCall(async () => {
    const params: any = {};
    if (options.fields) params.fields = options.fields;

    const response = await directusAxios.get(`/items/${collection}/${id}`, {
      params,
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

export async function createItem(
  collection: string, 
  data: any, 
  cookies?: string
) {
  return safeApiCall(async () => {
    const response = await directusAxios.post(`/items/${collection}`, data, {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

export async function updateItem(
  collection: string, 
  id: string | number, 
  data: any, 
  cookies?: string
) {
  return safeApiCall(async () => {
    const response = await directusAxios.patch(`/items/${collection}/${id}`, data, {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data.data;
  });
}

export async function deleteItem(
  collection: string, 
  id: string | number, 
  cookies?: string
) {
  return safeApiCall(async () => {
    await directusAxios.delete(`/items/${collection}/${id}`, {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return true;
  });
}

// Authentication
export async function login(email: string, password: string, mode: 'session' | 'json' = 'session') {
  return safeApiCall(async () => {
    const response = await directusAxios.post('/auth/login', {
      email,
      password,
      mode
    });
    return response.data;
  });
}

export async function logout(cookies?: string) {
  return safeApiCall(async () => {
    const response = await directusAxios.post('/auth/logout', {}, {
      headers: cookies ? { 'Cookie': cookies } : {}
    });
    return response.data;
  });
}
