import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { ApiResponse, AuthResponseData } from '../types/auth';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  requestData?: unknown;
  responseData?: unknown;
  error?: string;
}

export const apiLogs: ApiLogEntry[] = [];
export const listeners: Array<() => void> = [];

export function subscribeApiLogs(listener: () => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

function notifyLogs() {
  listeners.forEach((fn) => fn());
}

function addLog(entry: ApiLogEntry) {
  apiLogs.unshift(entry);
  if (apiLogs.length > 50) apiLogs.pop();
  notifyLogs();
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Bearer Access Token & Log Request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    const logId = Math.random().toString(36).substring(2, 9);
    (config as InternalAxiosRequestConfig & { _logId?: string })._logId = logId;

    addLog({
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      method: (config.method || 'GET').toUpperCase(),
      url: config.url || '',
      requestData: config.data,
    });

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle API errors, Auto 401 Token Refresh & Log Response
api.interceptors.response.use(
  (response) => {
    const logId = (response.config as InternalAxiosRequestConfig & { _logId?: string })._logId;
    if (logId) {
      const existing = apiLogs.find((l) => l.id === logId);
      if (existing) {
        existing.status = response.status;
        existing.responseData = response.data;
        notifyLogs();
      }
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _logId?: string;
    };

    const status = error.response?.status;
    const data = error.response?.data;

    // Log Error
    if (originalRequest?._logId) {
      const existing = apiLogs.find((l) => l.id === originalRequest._logId);
      if (existing) {
        existing.status = status || 500;
        existing.error = data?.message
          ? Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message
          : error.message;
        notifyLogs();
      }
    }

    // Toast error messages
    let errorMsg = 'An unexpected error occurred';
    if (data?.message) {
      errorMsg = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
    } else if (error.message) {
      errorMsg = error.message;
    }

    // Auto Refresh Logic for 401 Unauthorized
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('refreshToken')
          : null;

      if (refreshToken) {
        try {
          const res = await axios.post<ApiResponse<AuthResponseData>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
          );

          const newTokens = res.data.data;
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('refreshToken', newTokens.refreshToken);

          processQueue(null, newTokens.accessToken);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }

          toast.success('Session automatically refreshed!');
          return api(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          toast.error('Session expired. Redirecting to login...');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshErr);
        }
      }
    }

    // Display status specific toasts
    if (status === 400) {
      toast.error(`400 Bad Request: ${errorMsg}`);
    } else if (status === 401) {
      toast.error(`401 Unauthorized: ${errorMsg}`);
    } else if (status === 403) {
      toast.error(`403 Forbidden: ${errorMsg}`);
    } else if (status === 404) {
      toast.error(`404 Not Found: ${errorMsg}`);
    } else if (status === 409) {
      toast.error(`409 Conflict: ${errorMsg}`);
    } else if (status === 500) {
      toast.error(`500 Server Error: ${errorMsg}`);
    }

    return Promise.reject(error);
  },
);
