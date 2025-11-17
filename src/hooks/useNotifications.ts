// src/hooks/useNotifications.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const useNotificationsMe = () => {
  return useQuery<Notification[], Error>({
    queryKey: ['notifications', 'me'],
    queryFn: () => apiClient.get<Notification[]>(API_ENDPOINTS.NOTIFICATIONS_ME),
    staleTime: 60 * 1000,
  });
};

