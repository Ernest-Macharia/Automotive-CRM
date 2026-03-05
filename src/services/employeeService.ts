import { apiClient } from '@/lib/api/client';

export interface EmployeeDashboardSummary {
  [key: string]: unknown;
}

export interface EmployeeLeaveRequest {
  id: string;
  _id?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  supportingDocumentUrl?: string;
  isEmergencyLeave?: boolean;
  emergencyContact?: string;
  contactDuringLeave?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeLeaveApplicationData {
  leaveType: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'compassionate' | string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  supportingDocumentUrl?: string;
  isEmergencyLeave?: boolean;
  emergencyContact?: string;
  contactDuringLeave?: string;
}

export interface EmployeeKpi {
  id: string;
  _id?: string;
  title?: string;
  status?: string;
  score?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface EmployeeIncident {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  status?: string;
  severity?: string;
  createdAt?: string;
  acknowledged?: boolean;
  acknowledgement?: {
    decision?: 'accept' | 'reject' | string;
    reason?: string;
    date?: string;
  };
  [key: string]: unknown;
}

export interface EmployeeIncidentAcknowledgeData {
  decision: 'accept' | 'reject';
  reason?: string;
}

export interface EmployeeIncidentRespondData {
  message: string;
}

class EmployeeService {
  private readonly basePath = '/employee/me';

  private toObject(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private toArray(value: unknown): Record<string, unknown>[] {
    if (Array.isArray(value)) {
      return value.map(item => this.toObject(item));
    }

    const obj = this.toObject(value);
    const data = obj.data;
    if (Array.isArray(data)) {
      return data.map(item => this.toObject(item));
    }

    const items = obj.items;
    if (Array.isArray(items)) {
      return items.map(item => this.toObject(item));
    }

    return [];
  }

  async getDashboardSummary(): Promise<EmployeeDashboardSummary> {
    return apiClient.get<EmployeeDashboardSummary>(`${this.basePath}/dashboard`);
  }

  async getMyLeaves(status?: string): Promise<EmployeeLeaveRequest[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await apiClient.get<unknown>(`${this.basePath}/leaves${query}`);
    const obj = this.toObject(response);
    const leaves = this.toArray(response).length > 0 ? this.toArray(response) : this.toArray(obj.leaves);

    return leaves.map(leave => ({
      id: String(leave._id || leave.id || ''),
      _id: typeof leave._id === 'string' ? leave._id : undefined,
      leaveType: String(leave.leaveType || ''),
      startDate: String(leave.startDate || ''),
      endDate: String(leave.endDate || ''),
      days: Number(leave.days || 0),
      reason: String(leave.reason || ''),
      status: String(leave.status || 'pending'),
      supportingDocumentUrl: typeof leave.supportingDocumentUrl === 'string' ? leave.supportingDocumentUrl : undefined,
      isEmergencyLeave: Boolean(leave.isEmergencyLeave),
      emergencyContact: typeof leave.emergencyContact === 'string' ? leave.emergencyContact : undefined,
      contactDuringLeave: typeof leave.contactDuringLeave === 'string' ? leave.contactDuringLeave : undefined,
      createdAt: typeof leave.createdAt === 'string' ? leave.createdAt : undefined,
      updatedAt: typeof leave.updatedAt === 'string' ? leave.updatedAt : undefined,
    }));
  }

  async applyForLeave(data: EmployeeLeaveApplicationData): Promise<unknown> {
    const payload = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      days: Number(data.days),
    };
    return apiClient.post<EmployeeLeaveApplicationData, unknown>(`${this.basePath}/leaves`, payload as EmployeeLeaveApplicationData);
  }

  async getMyKpis(status?: string): Promise<EmployeeKpi[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await apiClient.get<unknown>(`${this.basePath}/kpis${query}`);
    const obj = this.toObject(response);
    const kpis = this.toArray(response).length > 0 ? this.toArray(response) : this.toArray(obj.kpis);

    return kpis.map(kpi => ({
      id: String(kpi._id || kpi.id || ''),
      _id: typeof kpi._id === 'string' ? kpi._id : undefined,
      title: String(kpi.title || kpi.kpiName || kpi.name || ''),
      status: typeof kpi.status === 'string' ? kpi.status : undefined,
      score: typeof kpi.score === 'number' ? kpi.score : typeof kpi.value === 'number' ? kpi.value : undefined,
      createdAt: typeof kpi.createdAt === 'string' ? kpi.createdAt : undefined,
      updatedAt: typeof kpi.updatedAt === 'string' ? kpi.updatedAt : undefined,
      ...kpi,
    }));
  }

  async getMyIncidents(): Promise<EmployeeIncident[]> {
    const response = await apiClient.get<unknown>(`${this.basePath}/incidents`);
    const obj = this.toObject(response);
    const incidents = this.toArray(response).length > 0 ? this.toArray(response) : this.toArray(obj.incidents);

    return incidents.map(incident => ({
      id: String(incident._id || incident.id || ''),
      _id: typeof incident._id === 'string' ? incident._id : undefined,
      title: String(incident.title || 'Untitled incident'),
      description: typeof incident.description === 'string' ? incident.description : undefined,
      status: typeof incident.status === 'string' ? incident.status : undefined,
      severity: typeof incident.severity === 'string' ? incident.severity : undefined,
      createdAt: typeof incident.createdAt === 'string' ? incident.createdAt : undefined,
      acknowledged: Boolean(incident.acknowledged),
      acknowledgement: this.toObject(incident.acknowledgement) as EmployeeIncident['acknowledgement'],
      ...incident,
    }));
  }

  async acknowledgeIncident(incidentId: string, data: EmployeeIncidentAcknowledgeData): Promise<unknown> {
    return apiClient.post<EmployeeIncidentAcknowledgeData, unknown>(
      `${this.basePath}/incidents/${incidentId}/acknowledge`,
      data
    );
  }

  async respondToIncident(incidentId: string, data: EmployeeIncidentRespondData): Promise<unknown> {
    return apiClient.post<EmployeeIncidentRespondData, unknown>(
      `${this.basePath}/incidents/${incidentId}/respond`,
      data
    );
  }
}

export const employeeService = new EmployeeService();
