/**
 * Handle Axios errors and return user-friendly error messages
 */
export function handleAxiosError(error: unknown, defaultMessage: string): string {
  if (error && typeof error === 'object') {
    // Axios error structure
    if ('response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      if (axiosError.response?.data?.errors?.[0]?.message) {
        return axiosError.response.data.errors[0].message;
      }
      if (axiosError.response?.status) {
        return `${defaultMessage} (${axiosError.response.status})`;
      }
    }
    
    // Direct error message
    if ('message' in error) {
      return (error as Error).message;
    }
  }
  
  return defaultMessage;
}
