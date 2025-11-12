// src/components/providers.tsx
'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { SessionExpiredError } from '@/services/authService';

const handleGlobalError = (error: unknown) => {
  console.error('Global error:', error);
  if (error instanceof SessionExpiredError) {
    window.location.href = '/login';
  }
};

const queryCache = new QueryCache({
  onError: handleGlobalError,
});

const mutationCache = new MutationCache({
  onError: handleGlobalError,
});

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {},
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}