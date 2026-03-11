import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/constants';
import { ApiError } from '@/types';

/**
 * Pre-configured Axios instance for all API calls.
 * Centralizes base URL, timeout, and error handling.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for uniform error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.data?.error) {
      const apiErr = error.response.data.error;
      return Promise.reject(new Error(apiErr.message || 'An API error occurred'));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please try again.'));
    }

    if (!error.response) {
      return Promise.reject(
        new Error('Unable to reach the server. Please check your connection.')
      );
    }

    return Promise.reject(
      new Error(`Server error (${error.response.status}). Please try again later.`)
    );
  }
);

export default apiClient;
