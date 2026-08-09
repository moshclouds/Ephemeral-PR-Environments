import axios from 'axios';

/**
 * Axios instance with PR-aware request interceptor.
 * Automatically reads `_pr` query params from the URL and propagates
 * them as `X-<Service>-PR` headers on every outgoing request.
 */
const api = axios.create();

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      if (key.endsWith('_pr')) {
        const serviceName = key.replace('_pr', '');
        const headerName = `X-${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}-PR`;
        config.headers[headerName] = value;
      }
    });
  }
  return config;
});

export default api;
