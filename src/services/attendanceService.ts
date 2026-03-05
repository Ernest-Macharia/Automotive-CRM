import { apiClient } from '@/lib/api/client';

export interface AttendanceRecord {
  _id?: string;
  userId?: string;
  organizationId?: string;
  date?: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  late?: boolean;
  lateMinutes?: number;
  leftEarly?: boolean;
  lessThan8Hours?: boolean;
  status?: 'present' | 'late' | 'half_day' | 'absent' | string;
}

export interface AttendanceCheckInData {
  note?: string;
  latitude?: number;
  longitude?: number;
}

export interface AttendanceCheckOutData {
  note?: string;
  latitude?: number;
  longitude?: number;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  totalHours: number;
  totalLateMinutes: number;
  totalOvertime: number;
}

export interface AttendanceRangeParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

class AttendanceService {
  private basePath = '/attendance';

  async checkIn(data: AttendanceCheckInData = {}): Promise<{ message: string; record: AttendanceRecord }> {
    try {
      return await apiClient.post<AttendanceCheckInData, { message: string; record: AttendanceRecord }>(
        `${this.basePath}/check-in`,
        data
      );
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  async checkOut(data: AttendanceCheckOutData = {}): Promise<{ message: string; record: AttendanceRecord }> {
    try {
      return await apiClient.post<AttendanceCheckOutData, { message: string; record: AttendanceRecord }>(
        `${this.basePath}/check-out`,
        data
      );
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  }

  async getToday(): Promise<AttendanceRecord | null> {
    try {
      return await apiClient.get<AttendanceRecord | null>(`${this.basePath}/today`);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw error;
    }
  }

  async getHistory(params?: AttendanceRangeParams): Promise<AttendanceRecord[]> {
    try {
      const query: Record<string, string> = {};
      if (params?.userId) query.userId = params.userId;
      if (params?.startDate) query.startDate = params.startDate;
      if (params?.endDate) query.endDate = params.endDate;
      return await apiClient.get<AttendanceRecord[]>(`${this.basePath}/history`, query);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      throw error;
    }
  }

  async getAll(params?: Omit<AttendanceRangeParams, 'userId'>): Promise<AttendanceRecord[]> {
    try {
      const query: Record<string, string> = {};
      if (params?.startDate) query.startDate = params.startDate;
      if (params?.endDate) query.endDate = params.endDate;
      return await apiClient.get<AttendanceRecord[]>(`${this.basePath}/all`, query);
    } catch (error) {
      console.error('Error fetching all attendance records:', error);
      throw error;
    }
  }

  async getLateToday(): Promise<AttendanceRecord[]> {
    try {
      return await apiClient.get<AttendanceRecord[]>(`${this.basePath}/late-today`);
    } catch (error) {
      console.error('Error fetching late users today:', error);
      throw error;
    }
  }

  async getShortHoursToday(): Promise<AttendanceRecord[]> {
    try {
      return await apiClient.get<AttendanceRecord[]>(`${this.basePath}/short-hours-today`);
    } catch (error) {
      console.error('Error fetching short-hours users today:', error);
      throw error;
    }
  }

  async getSummary(month: number, year: number, userId?: string): Promise<AttendanceSummary> {
    try {
      const query: Record<string, string> = {
        month: String(month),
        year: String(year),
      };
      if (userId) query.userId = userId;
      return await apiClient.get<AttendanceSummary>(`${this.basePath}/summary`, query);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  }
}

export const attendanceService = new AttendanceService();
