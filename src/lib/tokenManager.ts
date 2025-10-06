// Token manager to handle token synchronization between auth store and axios
class TokenManager {
  private static instance: TokenManager;
  private currentAccessToken: string | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Set the current access token
  setAccessToken(token: string | null) {
    this.currentAccessToken = token;
  }

  // Get the current access token
  getAccessToken(): string | null {
    return this.currentAccessToken;
  }

  // Get token from localStorage (fallback)
  getTokenFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const token = localStorage.getItem('nexpo-auth-storage');
      if (token) {
        const authData = JSON.parse(token);
        return authData.state?.accessToken || null;
      }
    } catch (error) {
      console.error('Failed to parse auth token from storage:', error);
    }
    return null;
  }

  // Get the best available token (from memory first, then storage)
  getBestAvailableToken(): string | null {
    return this.currentAccessToken || this.getTokenFromStorage();
  }
}

export const tokenManager = TokenManager.getInstance();
