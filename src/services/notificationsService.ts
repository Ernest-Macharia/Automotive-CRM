import { apiClient } from '@/lib/api/client';

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | string;

export interface NotificationEntity {
  _id?: string;
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}

class NotificationsService {
  private basePath = '/notifications';

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    try {
      return await apiClient.post<CreateNotificationData, NotificationEntity>(this.basePath, data);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getAll(): Promise<NotificationEntity[]> {
    try {
      return await apiClient.get<NotificationEntity[]>(this.basePath);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getMine(): Promise<NotificationEntity[]> {
    try {
      return await apiClient.get<NotificationEntity[]>(`${this.basePath}/me`);
    } catch (error) {
      console.error('Error fetching my notifications:', error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    try {
      return await apiClient.patch<Record<string, never>, NotificationEntity>(`${this.basePath}/${id}/read`, {});
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
