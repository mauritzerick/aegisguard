import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  withCredentials: true,
});

// Request interceptor - Add CSRF token
api.interceptors.request.use(config => {
  const csrf = getCookie('csrf_token');
  if (csrf) config.headers['x-csrf-token'] = csrf;
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await api.post('/auth/refresh');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // If still 401 after retry, or other errors, just reject
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Clear any stale cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// ============================================
// Observability Query API
// ============================================

export interface LogSearchParams {
  start: string;
  end: string;
  service?: string;
  level?: string;
  search?: string;
  trace_id?: string;
  limit?: number;
}

export interface MetricQueryParams {
  query: string; // e.g., "avg(http_requests_total{service='api'})"
  start: string;
  end: string;
  step?: string; // e.g., "5m"
}

export interface TraceSearchParams {
  start: string;
  end: string;
  service?: string;
  min_duration_ms?: number;
  status?: string;
  limit?: number;
}

export const observabilityAPI = {
  // Logs
  searchLogs: (params: LogSearchParams) =>
    api.post('/query/logs/search', params),
  
  // Metrics
  queryMetrics: (params: MetricQueryParams) =>
    api.post('/query/metrics', params),
  
  getMetricCatalog: () =>
    api.get('/query/metrics/catalog'),
  
  // Traces
  getTrace: (traceId: string) =>
    api.get(`/query/traces/${traceId}`),
  
  searchTraces: (params: TraceSearchParams) =>
    api.post('/query/traces/search', params),
  
  // RUM
  searchRUM: (params: { start: string; end: string; event_type?: string; limit?: number }) =>
    api.post('/query/rum/search', params),
  
  // Usage
  getUsage: (params: { start_date: string; end_date: string }) =>
    api.get('/query/usage', { params }),
};

export { api };

