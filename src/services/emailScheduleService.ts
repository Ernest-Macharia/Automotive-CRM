import { apiClient } from '@/lib/api/client';

export interface EmailSchedule {
  _id?: string;
  userId?: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  timezone: string;
  sendTime: string;
  email?: string;
  nextScheduled?: string | null;
  updatedAt?: string;
}

export interface UpdateEmailScheduleDto {
  enabled?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  timezone?: string;
  sendTime?: string;
  email?: string;
}

class EmailScheduleService {
  private basePath = '/email-schedule';

  async getMySchedule(): Promise<EmailSchedule | null> {
    try {
      return await apiClient.get<EmailSchedule>(`${this.basePath}/my-schedule`);
    } catch (error) {
      console.error('Error getting my email schedule:', error);
      throw error;
    }
  }

  async updateMySchedule(data: UpdateEmailScheduleDto): Promise<EmailSchedule> {
    try {
      return await apiClient.patch<UpdateEmailScheduleDto, EmailSchedule>(
        `${this.basePath}/my-schedule`,
        data
      );
    } catch (error) {
      console.error('Error updating my email schedule:', error);
      throw error;
    }
  }

  async getUserSchedule(userId: string): Promise<EmailSchedule | null> {
    try {
      return await apiClient.get<EmailSchedule>(`${this.basePath}/user/${userId}/schedule`);
    } catch (error) {
      console.error(`Error getting email schedule for user ${userId}:`, error);
      throw error;
    }
  }

  async updateUserSchedule(userId: string, data: UpdateEmailScheduleDto): Promise<EmailSchedule> {
    try {
      return await apiClient.patch<UpdateEmailScheduleDto, EmailSchedule>(
        `${this.basePath}/user/${userId}/schedule`,
        data
      );
    } catch (error) {
      console.error(`Error updating email schedule for user ${userId}:`, error);
      throw error;
    }
  }

  async sendTestReport(email?: string): Promise<{ success?: boolean; message: string }> {
    try {
      return await apiClient.post<{ email?: string }, { success?: boolean; message: string }>(
        `${this.basePath}/test`,
        { email }
      );
    } catch (error) {
      console.error('Error sending test report email:', error);
      throw error;
    }
  }

  async getAvailableTimezones(): Promise<string[]> {
    try {
      return await apiClient.get<string[]>(`${this.basePath}/timezones`);
    } catch (error) {
      console.error('Error getting available timezones:', error);
      throw error;
    }
  }

  async getNextScheduled(): Promise<{ nextScheduled: string | null; frequency?: string; enabled?: boolean }> {
    try {
      return await apiClient.get<{ nextScheduled: string | null; frequency?: string; enabled?: boolean }>(
        `${this.basePath}/next-scheduled`
      );
    } catch (error) {
      console.error('Error getting next scheduled report time:', error);
      throw error;
    }
  }
}

export const emailScheduleService = new EmailScheduleService();

