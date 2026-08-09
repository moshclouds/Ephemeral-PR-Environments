const cloudRunSuffix = import.meta.env.VITE_CLOUD_RUN_SUFFIX;

/**
 * Resolves the base URL for a backend service.
 *
 * Priority:
 * 1. If a `_pr` query param exists AND `VITE_CLOUD_RUN_SUFFIX` is set,
 *    constructs a direct Cloud Run URL (e.g. `https://order-service-pr-1-xxx.run.app`).
 * 2. Falls back to the environment variable (staging URL).
 * 3. Falls back to localhost for local development.
 */
const getBaseUrl = (
  servicePrefix: string,
  envVar: string | undefined,
  defaultLocalUrl: string,
  prQueryKey: string
): string => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const prNumber = urlParams.get(prQueryKey);
    if (prNumber && cloudRunSuffix) {
      return `https://${servicePrefix}-pr-${prNumber}${cloudRunSuffix}`;
    }
  }
  return envVar || defaultLocalUrl;
};

export const ORDER_URL = getBaseUrl(
  'order-service',
  import.meta.env.VITE_API_ORDER_URL,
  'http://localhost:3000',
  'order_pr'
);

export const INVENTORY_URL = getBaseUrl(
  'inventory-service',
  import.meta.env.VITE_API_INVENTORY_URL,
  'http://localhost:3001',
  'inventory_pr'
);

export const NOTIFICATION_URL = getBaseUrl(
  'notification-service',
  import.meta.env.VITE_API_NOTIFICATION_URL,
  'http://localhost:3002',
  'notification_pr'
);
