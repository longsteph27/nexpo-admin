import { apiClient } from './api-client';
import { 
  CollectionName, 
  CollectionItem, 
  CollectionResponse, 
  SingleItemResponse
} from '@/types/collections';

export class CollectionsAPI {
  private baseUrl = '/api/data';

  // Get all items from a collection
  async getCollectionItems<T = CollectionItem>(
    collection: CollectionName,
    params?: {
      limit?: number;
      offset?: number;
      fields?: string[];
      filter?: Record<string, unknown>;
      sort?: string[];
      search?: string;
      page?: number;
    }
  ): Promise<CollectionResponse<T>> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.fields) {
      // Handle Directus array format: fields[]=field1&fields[]=field2
      params.fields.forEach(field => {
        searchParams.append('fields[]', field);
      });
    }
    if (params?.sort) {
      // Handle Directus array format: sort[]=field1&sort[]=field2
      params.sort.forEach(sort => {
        searchParams.append('sort[]', sort);
      });
    }
    if (params?.search) searchParams.append('search', params.search);
    if (params?.filter) {
      // Handle Directus filter format: filter[field][_neq]=value
      Object.entries(params.filter).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([operator, operatorValue]) => {
            searchParams.append(`filter[${key}][${operator}]`, String(operatorValue));
          });
        } else {
          searchParams.append(`filter[${key}]`, String(value));
        }
      });
    }

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}/${collection}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.json();
  }

  // Get a single item by ID
  async getCollectionItem<T = CollectionItem>(
    collection: CollectionName,
    id: string | number,
    fields?: string[]
  ): Promise<SingleItemResponse<T>> {
    const searchParams = new URLSearchParams();
    if (fields) searchParams.append('fields', fields.join(','));
    
    const queryString = searchParams.toString();
    const url = `${this.baseUrl}/${collection}/${id}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.json();
  }

  // Create a new item
  async createItem(
    collection: CollectionName,
    data: Record<string, unknown>
  ): Promise<SingleItemResponse> {
    const url = `${this.baseUrl}/${collection}`;
    const response = await apiClient.post(url, data);
    return response.json();
  }

  // Update an existing item
  async updateItem(
    collection: CollectionName,
    id: string | number,
    data: Record<string, unknown>
  ): Promise<SingleItemResponse> {
    const url = `${this.baseUrl}/${collection}/${id}`;
    const response = await apiClient.put(url, data);
    return response.json();
  }

  // Delete an item
  async deleteItem(
    collection: CollectionName,
    id: string | number
  ): Promise<void> {
    const url = `${this.baseUrl}/${collection}/${id}`;
    await apiClient.delete(url);
  }

  // Get collection metadata
  async getCollectionMeta(collection: CollectionName): Promise<unknown> {
    const url = `${this.baseUrl}/${collection}/meta`;
    const response = await apiClient.get(url);
    return response.json();
  }

  // Bulk operations
  async createMultipleItems(
    collection: CollectionName,
    items: Record<string, unknown>[]
  ): Promise<CollectionResponse> {
    const url = `${this.baseUrl}/${collection}`;
    const response = await apiClient.post(url, items);
    return response.json();
  }

  async updateMultipleItems(
    collection: CollectionName,
    updates: Array<{ id: string | number; data: Record<string, unknown> }>
  ): Promise<CollectionResponse> {
    const url = `${this.baseUrl}/${collection}`;
    const response = await apiClient.put(url, updates);
    return response.json();
  }

  async deleteMultipleItems(
    collection: CollectionName,
    ids: (string | number)[]
  ): Promise<void> {
    const url = `${this.baseUrl}/${collection}`;
    await apiClient.delete(url, { body: JSON.stringify(ids) });
  }
}

// Export singleton instance
export const collectionsAPI = new CollectionsAPI();
