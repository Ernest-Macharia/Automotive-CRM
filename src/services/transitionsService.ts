import { apiClient } from '@/lib/api/client';

export interface UserReference {
  _id: string;
  email: string;
  role: string;
}

export interface Transition {
  _id: string;
  module: string;
  recordId: string;
  fromStage?: string;
  toStage: string;
  changedBy: string | UserReference;
  comments?: string;
  type: 'manual' | 'automatic';
  timestamp: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateTransitionDto {
  module: string;
  recordId: string;
  fromStage?: string;
  toStage: string;
  changedBy: string;
  comments?: string;
  type?: 'manual' | 'automatic';
}

export interface TransitionFilters {
  module?: string;
  recordId?: string;
  fromStage?: string;
  toStage?: string;
  type?: 'manual' | 'automatic';
  startDate?: string;
  endDate?: string;
  changedBy?: string;
}

// Extended ApiClient for transitions service
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    if ((apiClient as any).API_BASE_URL) {
      return (apiClient as any).API_BASE_URL;
    }
    try {
      const config = require('@/lib/api/config');
      return config.API_BASE_URL || '';
    } catch {
      return '';
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async requestWithHeaders<T>(
    endpoint: string, 
    options: RequestInit = {},
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
      ...customHeaders,
    };

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      if (response.status === 401) {
        sessionStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
      }
      
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    return this.requestWithHeaders<T>(url, { method: 'GET' }, headers);
  }

  async post<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, headers);
  }

  async put<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, headers);
  }

  async patch<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'DELETE',
    }, headers);
  }
}

const extendedApiClient = new ExtendedApiClient();

class TransitionsService {
  // 1. Get all transitions (with optional module filter)
  async getAllTransitions(module?: string): Promise<Transition[]> {
    try {
      const params: Record<string, string> = {};
      if (module) {
        params.module = module;
      }
      
      return await extendedApiClient.get<Transition[]>('/transitions', params);
    } catch (error) {
      console.error(`Error getting transitions${module ? ` for module ${module}` : ''}:`, error);
      throw error;
    }
  }

  // 2. Get transitions for a specific module and record
  async getTransitionsForRecord(module: string, recordId: string): Promise<Transition[]> {
    try {
      if (!module || !recordId) {
        throw new Error('Module and recordId are required');
      }
      
      return await extendedApiClient.get<Transition[]>(`/transitions/${module}/${recordId}`);
    } catch (error) {
      console.error(`Error getting transitions for ${module}/${recordId}:`, error);
      throw error;
    }
  }

  // 3. Log a new transition
  async logTransition(data: CreateTransitionDto): Promise<Transition> {
    try {
      if (!data.module || !data.recordId || !data.toStage || !data.changedBy) {
        throw new Error('Module, recordId, toStage, and changedBy are required');
      }
      
      return await extendedApiClient.post<CreateTransitionDto, Transition>('/transitions', data);
    } catch (error) {
      console.error('Error logging transition:', error);
      throw error;
    }
  }

  // Utility methods
  async logManualTransition(
    module: string,
    recordId: string,
    fromStage: string,
    toStage: string,
    changedBy: string,
    comments?: string
  ): Promise<Transition> {
    try {
      return await this.logTransition({
        module,
        recordId,
        fromStage,
        toStage,
        changedBy,
        comments,
        type: 'manual'
      });
    } catch (error) {
      console.error(`Error logging manual transition for ${module}/${recordId}:`, error);
      throw error;
    }
  }

  async logAutomaticTransition(
    module: string,
    recordId: string,
    fromStage: string,
    toStage: string,
    changedBy: string,
    comments?: string
  ): Promise<Transition> {
    try {
      return await this.logTransition({
        module,
        recordId,
        fromStage,
        toStage,
        changedBy,
        comments,
        type: 'automatic'
      });
    } catch (error) {
      console.error(`Error logging automatic transition for ${module}/${recordId}:`, error);
      throw error;
    }
  }

  async getTransitionsWithFilters(filters: TransitionFilters): Promise<Transition[]> {
    try {
      // Note: Since backend only supports module filter, we'll filter client-side
      const allTransitions = await this.getAllTransitions(filters.module);
      
      return allTransitions.filter(transition => {
        if (filters.recordId && transition.recordId !== filters.recordId) return false;
        if (filters.fromStage && transition.fromStage !== filters.fromStage) return false;
        if (filters.toStage && transition.toStage !== filters.toStage) return false;
        if (filters.type && transition.type !== filters.type) return false;
        if (filters.changedBy) {
          const changedById = typeof transition.changedBy === 'string' 
            ? transition.changedBy 
            : transition.changedBy._id;
          if (changedById !== filters.changedBy) return false;
        }
        
        // Date filtering
        if (filters.startDate || filters.endDate) {
          const transitionDate = new Date(transition.createdAt);
          
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            if (transitionDate < startDate) return false;
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (transitionDate > endDate) return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error getting transitions with filters:', error);
      throw error;
    }
  }

  async getRecentTransitions(limit: number = 20): Promise<Transition[]> {
    try {
      const allTransitions = await this.getAllTransitions();
      return allTransitions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent transitions:', error);
      throw error;
    }
  }

  async getTransitionTimeline(
    module: string,
    recordId: string
  ): Promise<Array<{
    transition: Transition;
    durationFromPrevious?: number; // in minutes
    isFirst: boolean;
    isLast: boolean;
  }>> {
    try {
      const transitions = await this.getTransitionsForRecord(module, recordId);
      
      return transitions.map((transition, index) => {
        let durationFromPrevious: number | undefined;
        
        if (index > 0) {
          const currentDate = new Date(transition.createdAt);
          const previousDate = new Date(transitions[index - 1].createdAt);
          durationFromPrevious = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60); // minutes
        }
        
        return {
          transition,
          durationFromPrevious: durationFromPrevious ? parseFloat(durationFromPrevious.toFixed(2)) : undefined,
          isFirst: index === 0,
          isLast: index === transitions.length - 1
        };
      });
    } catch (error) {
      console.error(`Error getting timeline for ${module}/${recordId}:`, error);
      throw error;
    }
  }

  async getTransitionStatistics(filters?: TransitionFilters): Promise<{
    totalTransitions: number;
    manualTransitions: number;
    automaticTransitions: number;
    byModule: Record<string, number>;
    byStage: Record<string, number>;
    byUser: Record<string, number>;
    averageDuration: number; // average time between transitions in minutes
    busiestDay?: string;
  }> {
    try {
      let transitions = filters 
        ? await this.getTransitionsWithFilters(filters)
        : await this.getAllTransitions();
      
      if (transitions.length === 0) {
        return {
          totalTransitions: 0,
          manualTransitions: 0,
          automaticTransitions: 0,
          byModule: {},
          byStage: {},
          byUser: {},
          averageDuration: 0
        };
      }
      
      // Count by type
      const manualTransitions = transitions.filter(t => t.type === 'manual').length;
      const automaticTransitions = transitions.filter(t => t.type === 'automatic').length;
      
      // Count by module
      const byModule: Record<string, number> = {};
      transitions.forEach(transition => {
        byModule[transition.module] = (byModule[transition.module] || 0) + 1;
      });
      
      // Count by stage (toStage)
      const byStage: Record<string, number> = {};
      transitions.forEach(transition => {
        byStage[transition.toStage] = (byStage[transition.toStage] || 0) + 1;
      });
      
      // Count by user
      const byUser: Record<string, number> = {};
      transitions.forEach(transition => {
        const userId = typeof transition.changedBy === 'string' 
          ? transition.changedBy 
          : transition.changedBy._id;
        byUser[userId] = (byUser[userId] || 0) + 1;
      });
      
      // Calculate average duration between transitions
      let totalDuration = 0;
      let durationCount = 0;
      
      // Group by recordId to calculate durations within each record's timeline
      const recordsMap = new Map<string, Transition[]>();
      transitions.forEach(transition => {
        const key = `${transition.module}_${transition.recordId}`;
        if (!recordsMap.has(key)) {
          recordsMap.set(key, []);
        }
        recordsMap.get(key)!.push(transition);
      });
      
      recordsMap.forEach(recordTransitions => {
        // Sort by date
        const sorted = recordTransitions.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        // Calculate durations between consecutive transitions
        for (let i = 1; i < sorted.length; i++) {
          const current = new Date(sorted[i].createdAt);
          const previous = new Date(sorted[i - 1].createdAt);
          const duration = (current.getTime() - previous.getTime()) / (1000 * 60); // minutes
          totalDuration += duration;
          durationCount++;
        }
      });
      
      const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;
      
      // Find busiest day
      const byDay: Record<string, number> = {};
      let busiestDay: string | undefined;
      let maxCount = 0;
      
      transitions.forEach(transition => {
        const date = new Date(transition.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
        byDay[date] = (byDay[date] || 0) + 1;
        
        if (byDay[date] > maxCount) {
          maxCount = byDay[date];
          busiestDay = date;
        }
      });
      
      return {
        totalTransitions: transitions.length,
        manualTransitions,
        automaticTransitions,
        byModule,
        byStage,
        byUser,
        averageDuration: parseFloat(averageDuration.toFixed(2)),
        busiestDay
      };
    } catch (error) {
      console.error('Error getting transition statistics:', error);
      throw error;
    }
  }

  async getUserActivity(userId: string, days: number = 30): Promise<{
    totalTransitions: number;
    byModule: Record<string, number>;
    byType: Record<'manual' | 'automatic', number>;
    recentActivity: Transition[];
    averagePerDay: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const filters: TransitionFilters = {
        changedBy: userId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      const transitions = await this.getTransitionsWithFilters(filters);
      
      const byModule: Record<string, number> = {};
      const byType: Record<'manual' | 'automatic', number> = { manual: 0, automatic: 0 };
      
      transitions.forEach(transition => {
        // Count by module
        byModule[transition.module] = (byModule[transition.module] || 0) + 1;
        
        // Count by type
        byType[transition.type] = (byType[transition.type] || 0) + 1;
      });
      
      // Get recent activity (last 10 transitions)
      const recentActivity = transitions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      
      // Calculate average per day
      const dayCount = Math.max(1, days);
      const averagePerDay = transitions.length / dayCount;
      
      return {
        totalTransitions: transitions.length,
        byModule,
        byType,
        recentActivity,
        averagePerDay: parseFloat(averagePerDay.toFixed(2))
      };
    } catch (error) {
      console.error(`Error getting user activity for ${userId}:`, error);
      throw error;
    }
  }

  async getModuleActivity(module: string, days: number = 30): Promise<{
    totalTransitions: number;
    byStage: Record<string, number>;
    byUser: Record<string, number>;
    timeline: Array<{
      date: string;
      count: number;
    }>;
    mostActiveUser?: string;
    mostCommonTransition?: string;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const filters: TransitionFilters = {
        module,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      const transitions = await this.getTransitionsWithFilters(filters);
      
      if (transitions.length === 0) {
        return {
          totalTransitions: 0,
          byStage: {},
          byUser: {},
          timeline: []
        };
      }
      
      // Count by stage
      const byStage: Record<string, number> = {};
      
      // Count by user
      const byUser: Record<string, number> = {};
      let mostActiveUserId: string | undefined;
      let maxUserCount = 0;
      
      // Build timeline
      const timelineMap: Record<string, number> = {};
      
      transitions.forEach(transition => {
        // Count by stage (toStage)
        byStage[transition.toStage] = (byStage[transition.toStage] || 0) + 1;
        
        // Count by user
        const userId = typeof transition.changedBy === 'string' 
          ? transition.changedBy 
          : transition.changedBy._id;
        byUser[userId] = (byUser[userId] || 0) + 1;
        
        if (byUser[userId] > maxUserCount) {
          maxUserCount = byUser[userId];
          mostActiveUserId = userId;
        }
        
        // Add to timeline
        const date = new Date(transition.createdAt).toISOString().split('T')[0];
        timelineMap[date] = (timelineMap[date] || 0) + 1;
      });
      
      // Convert timeline map to array
      const timeline = Object.entries(timelineMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Find most common transition
      let mostCommonTransition: string | undefined;
      let maxTransitionCount = 0;
      
      Object.entries(byStage).forEach(([stage, count]) => {
        if (count > maxTransitionCount) {
          maxTransitionCount = count;
          mostCommonTransition = stage;
        }
      });
      
      return {
        totalTransitions: transitions.length,
        byStage,
        byUser,
        timeline,
        mostActiveUser: mostActiveUserId,
        mostCommonTransition
      };
    } catch (error) {
      console.error(`Error getting module activity for ${module}:`, error);
      throw error;
    }
  }

  async searchTransitions(
    searchTerm: string,
    filters?: TransitionFilters
  ): Promise<Transition[]> {
    try {
      const transitions = filters 
        ? await this.getTransitionsWithFilters(filters)
        : await this.getAllTransitions();
      
      const searchLower = searchTerm.toLowerCase();
      
      return transitions.filter(transition => {
        // Search in module
        if (transition.module.toLowerCase().includes(searchLower)) return true;
        
        // Search in recordId
        if (transition.recordId.includes(searchTerm)) return true;
        
        // Search in fromStage
        if (transition.fromStage && transition.fromStage.toLowerCase().includes(searchLower)) return true;
        
        // Search in toStage
        if (transition.toStage.toLowerCase().includes(searchLower)) return true;
        
        // Search in comments
        if (transition.comments && transition.comments.toLowerCase().includes(searchLower)) return true;
        
        // Search in user email (if populated)
        if (typeof transition.changedBy !== 'string') {
          if (transition.changedBy.email.toLowerCase().includes(searchLower)) return true;
        }
        
        return false;
      });
    } catch (error) {
      console.error(`Error searching transitions for "${searchTerm}":`, error);
      throw error;
    }
  }

  async exportTransitions(
    format: 'csv' | 'json' = 'json',
    filters?: TransitionFilters
  ): Promise<string> {
    try {
      const transitions = filters 
        ? await this.getTransitionsWithFilters(filters)
        : await this.getAllTransitions();
      
      if (format === 'csv') {
        const headers = ['Module', 'Record ID', 'From Stage', 'To Stage', 'Type', 'Changed By', 'Comments', 'Date'];
        const rows = transitions.map(transition => {
          const changedBy = typeof transition.changedBy === 'string' 
            ? transition.changedBy 
            : `${transition.changedBy.email} (${transition.changedBy.role})`;
          
          return [
            `"${transition.module}"`,
            `"${transition.recordId}"`,
            transition.fromStage ? `"${transition.fromStage}"` : '',
            `"${transition.toStage}"`,
            `"${transition.type}"`,
            `"${changedBy}"`,
            transition.comments ? `"${transition.comments.replace(/"/g, '""')}"` : '',
            `"${new Date(transition.createdAt).toLocaleString()}"`
          ];
        });
        
        return [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
      } else {
        return JSON.stringify(transitions, null, 2);
      }
    } catch (error) {
      console.error(`Error exporting transitions in ${format} format:`, error);
      throw error;
    }
  }

  async getTransitionSummary(recordId: string, module: string): Promise<{
    totalTransitions: number;
    firstTransition?: Transition;
    lastTransition?: Transition;
    stageProgression: Array<{
      stage: string;
      enteredAt: Date;
      duration?: number; // minutes spent in this stage
    }>;
    totalDuration: number; // total time from first to last transition in minutes
  }> {
    try {
      const transitions = await this.getTransitionsForRecord(module, recordId);
      
      if (transitions.length === 0) {
        return {
          totalTransitions: 0,
          stageProgression: [],
          totalDuration: 0
        };
      }
      
      // Sort by date
      const sortedTransitions = transitions.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const firstTransition = sortedTransitions[0];
      const lastTransition = sortedTransitions[sortedTransitions.length - 1];
      
      // Calculate stage progression
      const stageProgression: Array<{
        stage: string;
        enteredAt: Date;
        duration?: number;
      }> = [];
      
      for (let i = 0; i < sortedTransitions.length; i++) {
        const currentTransition = sortedTransitions[i];
        
        if (i === 0 || currentTransition.toStage !== sortedTransitions[i - 1].toStage) {
          stageProgression.push({
            stage: currentTransition.toStage,
            enteredAt: new Date(currentTransition.createdAt)
          });
        }
        
        // Calculate duration for this stage if there's a next transition
        if (i < sortedTransitions.length - 1) {
          const nextTransition = sortedTransitions[i + 1];
          if (nextTransition.toStage !== currentTransition.toStage) {
            const stageEntry = stageProgression[stageProgression.length - 1];
            const exitTime = new Date(nextTransition.createdAt);
            const duration = (exitTime.getTime() - stageEntry.enteredAt.getTime()) / (1000 * 60); // minutes
            stageEntry.duration = parseFloat(duration.toFixed(2));
          }
        }
      }
      
      // Calculate total duration
      const totalDuration = (new Date(lastTransition.createdAt).getTime() - 
                           new Date(firstTransition.createdAt).getTime()) / (1000 * 60); // minutes
      
      return {
        totalTransitions: transitions.length,
        firstTransition,
        lastTransition,
        stageProgression,
        totalDuration: parseFloat(totalDuration.toFixed(2))
      };
    } catch (error) {
      console.error(`Error getting transition summary for ${module}/${recordId}:`, error);
      throw error;
    }
  }

  async bulkLogTransitions(
    transitions: CreateTransitionDto[]
  ): Promise<Array<{
    data: CreateTransitionDto;
    success: boolean;
    result?: Transition;
    error?: string;
  }>> {
    try {
      const results = [];
      
      for (const transition of transitions) {
        try {
          const result = await this.logTransition(transition);
          results.push({
            data: transition,
            success: true,
            result
          });
        } catch (error: any) {
          results.push({
            data: transition,
            success: false,
            error: error.message || 'Unknown error'
          });
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      return results;
    } catch (error) {
      console.error('Error bulk logging transitions:', error);
      throw error;
    }
  }

  async getSimilarTransitions(
    module: string,
    toStage: string,
    limit: number = 10
  ): Promise<Transition[]> {
    try {
      const filters: TransitionFilters = {
        module,
        toStage
      };
      
      const transitions = await this.getTransitionsWithFilters(filters);
      
      // Sort by most recent
      return transitions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error(`Error getting similar transitions for ${module} -> ${toStage}:`, error);
      throw error;
    }
  }

  async getTransitionPatterns(module: string): Promise<{
    commonPaths: Array<{
      fromStage: string;
      toStage: string;
      count: number;
      percentage: number;
    }>;
    averageTransitionsPerRecord: number;
    mostCommonSequence?: string[];
  }> {
    try {
      const transitions = await this.getTransitionsWithFilters({ module });
      
      if (transitions.length === 0) {
        return {
          commonPaths: [],
          averageTransitionsPerRecord: 0
        };
      }
      
      // Group transitions by recordId
      const recordsMap = new Map<string, Transition[]>();
      transitions.forEach(transition => {
        const key = transition.recordId;
        if (!recordsMap.has(key)) {
          recordsMap.set(key, []);
        }
        recordsMap.get(key)!.push(transition);
      });
      
      // Analyze common paths
      const pathCounts = new Map<string, number>();
      let totalPaths = 0;
      
      recordsMap.forEach(recordTransitions => {
        // Sort by date
        const sorted = recordTransitions.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        // Extract path (fromStage -> toStage pairs)
        for (let i = 0; i < sorted.length; i++) {
          const fromStage = i === 0 ? 'START' : sorted[i - 1].toStage;
          const toStage = sorted[i].toStage;
          const pathKey = `${fromStage} → ${toStage}`;
          
          pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);
          totalPaths++;
        }
      });
      
      // Convert to array and calculate percentages
      const commonPaths = Array.from(pathCounts.entries())
        .map(([path, count]) => ({
          path,
          fromStage: path.split(' → ')[0],
          toStage: path.split(' → ')[1],
          count,
          percentage: parseFloat(((count / totalPaths) * 100).toFixed(2))
        }))
        .sort((a, b) => b.count - a.count);
      
      // Calculate average transitions per record
      const averageTransitionsPerRecord = transitions.length / recordsMap.size;
      
      // Find most common sequence (simplified - just look for most common consecutive pairs)
      let mostCommonSequence: string[] = [];
      let maxSequenceCount = 0;
      
      // This is a simplified analysis - in a real scenario, you'd use more sophisticated
      // sequence mining algorithms
      const sequenceCounts = new Map<string, number>();
      
      recordsMap.forEach(recordTransitions => {
        const sorted = recordTransitions.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        if (sorted.length > 1) {
          for (let i = 0; i < sorted.length - 1; i++) {
            const sequence = `${sorted[i].toStage} → ${sorted[i + 1].toStage}`;
            sequenceCounts.set(sequence, (sequenceCounts.get(sequence) || 0) + 1);
            
            if ((sequenceCounts.get(sequence) || 0) > maxSequenceCount) {
              maxSequenceCount = sequenceCounts.get(sequence) || 0;
              mostCommonSequence = [sorted[i].toStage, sorted[i + 1].toStage];
            }
          }
        }
      });
      
      return {
        commonPaths,
        averageTransitionsPerRecord: parseFloat(averageTransitionsPerRecord.toFixed(2)),
        mostCommonSequence: mostCommonSequence.length > 0 ? mostCommonSequence : undefined
      };
    } catch (error) {
      console.error(`Error getting transition patterns for ${module}:`, error);
      throw error;
    }
  }
}

export const transitionsService = new TransitionsService();