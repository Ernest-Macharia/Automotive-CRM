// src/hooks/useUser.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, SessionExpiredError } from '@/services/authService';
import { useEffect } from 'react';

/**
 * Hook to get current authenticated user
 * React Query v5+ FULLY compatible
 * No deprecated options
 */
export function useUser() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // ← FIXED: was cacheTime
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle error outside useQuery options
  useEffect(() => {
    if (query.error) {
      console.error('useUser error:', query.error);
      if (query.error instanceof SessionExpiredError) {
        window.location.href = '/login';
      }
    }
  }, [query.error]);

  return query;
}