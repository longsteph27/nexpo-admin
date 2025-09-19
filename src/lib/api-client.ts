// Simple API client for making HTTP requests
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async get(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'GET',
      credentials: 'include',
      ...options,
    });
    return response;
  }

  async post(url: string, data?: unknown, options?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response;
  }

  async put(url: string, data?: unknown, options?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response;
  }

  async delete(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'DELETE',
      credentials: 'include',
      ...options,
    });
    return response;
  }
}

export const apiClient = new ApiClient();