const API_PROXY_PREFIX = '/_api_proxy';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const isAbsoluteHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const toProxyBaseUrl = (absoluteUrl: string): string => {
  try {
    const parsed = new URL(absoluteUrl);
    const normalizedPath = trimTrailingSlash(parsed.pathname || '');
    const proxiedPath = trimTrailingSlash(`${API_PROXY_PREFIX}${normalizedPath}`);
    return proxiedPath || API_PROXY_PREFIX;
  } catch {
    return API_PROXY_PREFIX;
  }
};

const resolveApiBaseUrl = (): string => {
  const configuredBaseUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || '');

  if (!configuredBaseUrl) {
    return '';
  }

  if (
    typeof window !== 'undefined' &&
    isAbsoluteHttpUrl(configuredBaseUrl)
  ) {
    return toProxyBaseUrl(configuredBaseUrl);
  }

  return configuredBaseUrl;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  OPPORTUNITIES: {
    BASE: '/opportunities',
    OVERVIEW: '/opportunities/overview',
    SALES_REPS: '/opportunities/sales-reps/available',
    TIER: (tier: string) => `/opportunities/tier/${tier}`,
    HOT_PRIORITY: '/opportunities/hot/priority',
    LEAD_SCORE: (id: string) => `/opportunities/${id}/lead-score`,
    RECALCULATE_SCORE: (id: string) => `/opportunities/${id}/recalculate-score`,
    SCORING_STATS: '/opportunities/scoring/stats',
    RECALCULATE_ALL: '/opportunities/scoring/recalculate-all',
  },
  CLIENTS: {
    BASE: '/clients',
  },
  VEHICLES: {
    BASE: '/vehicles',
  },
  QUOTES: {
    BASE: '/quotes',
  },
  INVOICES: {
    BASE: '/invoices',
  },
  PAYMENTS: {
    BASE: '/payments',
  },
};

export const REQUEST_TIMEOUT = 10000;
