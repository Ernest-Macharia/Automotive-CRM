// services/serviceService.ts
import { apiClient } from '@/lib/api/client';

export interface UserRef {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
}

export interface Service {
  _id: string;
  id: string;
  serviceCode: string;
  name: string;
  description: string;
  type: 'repair' | 'maintenance' | 'inspection' | 'installation' | 'custom';
  tags: string[];
  status: 'active' | 'inactive' | 'discontinued';
  isActive: boolean;
  version: number;
  createdBy: UserRef;
  internalNotes?: string;
  serviceNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  serviceCode?: string;
  name: string;
  description: string;
  type: 'repair' | 'maintenance' | 'inspection' | 'installation' | 'custom';
  tags?: string[];
  internalNotes?: string;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  type?: 'repair' | 'maintenance' | 'inspection' | 'installation' | 'custom';
  status?: 'active' | 'inactive' | 'discontinued';
  isActive?: boolean;
  tags?: string[];
  internalNotes?: string;
  serviceNotes?: string[];
}

export interface ServiceFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  tags?: string;
  search?: string;
  sort?: string;
}

class ServiceService {
  /**
   * Create a new service
   * POST /api/v1/services
   */
  async createService(data: CreateServiceData, userId?: string): Promise<Service> {
    try {
      const response = await apiClient.post<CreateServiceData, any>('/services', data);
      
      if (response.success && response.data) {
        return this.normalizeService(response.data);
      } else if (response._id || response.id) {
        return this.normalizeService(response);
      } else {
        console.error('Service creation response missing ID:', response);
        throw new Error('Service creation failed: No ID returned');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Get all services
   * GET /api/v1/services
   */
  async getAllServices(params?: ServiceFilterParams): Promise<Service[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/services${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any[]>(endpoint);
      
      let servicesData: any[] = [];
      
      if (Array.isArray(response)) {
        servicesData = response;
      } else {
        return [];
      }
      
      return servicesData.map(service => this.normalizeService(service));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  /**
   * Get a service by ID
   * GET /api/v1/services/{id}
   */
  async getServiceById(id: string): Promise<Service> {
    try {
      const response = await apiClient.get<any>(`/services/${id}`);
      
      let serviceData = response;
      if (response.success && response.data) {
        serviceData = response.data;
      }
      
      return this.normalizeService(serviceData);
    } catch (error) {
      console.error(`Error fetching service ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a service by service code
   * GET /api/v1/services/code/{serviceCode}
   */
  async getServiceByCode(serviceCode: string): Promise<Service> {
    try {
      const response = await apiClient.get<any>(`/services/code/${serviceCode}`);
      
      let serviceData = response;
      if (response.success && response.data) {
        serviceData = response.data;
      }
      
      return this.normalizeService(serviceData);
    } catch (error) {
      console.error(`Error fetching service with code ${serviceCode}:`, error);
      throw error;
    }
  }

  /**
   * Search services
   * GET /api/v1/services/search
   */
  async searchServices(query: string): Promise<Service[]> {
    try {
      const response = await apiClient.get<any[]>(`/services/search?q=${encodeURIComponent(query)}`);
      
      let servicesData: any[] = [];
      
      if (Array.isArray(response)) {
        servicesData = response;
      } else {
        return [];
      }
      
      return servicesData.map(service => this.normalizeService(service));
    } catch (error) {
      console.error('Error searching services:', error);
      throw error;
    }
  }

  /**
   * Update a service
   * PATCH /api/v1/services/{id}
   */
  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    try {
      const response = await apiClient.patch<UpdateServiceData, any>(`/services/${id}`, data);
      
      if (response.success && response.data) {
        return this.normalizeService(response.data);
      } else {
        return this.normalizeService(response);
      }
    } catch (error) {
      console.error(`Error updating service ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a service (soft delete)
   * DELETE /api/v1/services/{id}
   */
  async deleteService(id: string): Promise<{ message: string; serviceCode: string; name: string }> {
    try {
      const response = await apiClient.delete<{ message: string; serviceCode: string; name: string }>(`/services/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting service ${id}:`, error);
      throw error;
    }
  }

  /**
   * Normalize service data from backend
   */
  private normalizeService(data: any): Service {
    let serviceData = data;
    if (data.data && (data.data._id || data.data.id)) {
      serviceData = data.data;
    }
    
    const id = serviceData._id || serviceData.id;
    
    if (!id) {
      console.error('❌ Cannot find ID in service data:', serviceData);
      throw new Error('Service data missing ID');
    }
    
    // Extract createdBy
    let createdBy: UserRef = {
      _id: '',
      id: '',
      email: '',
      name: ''
    };
    
    if (typeof serviceData.createdBy === 'string') {
      createdBy._id = serviceData.createdBy;
      createdBy.id = serviceData.createdBy;
    } else if (serviceData.createdBy?._id) {
      createdBy = {
        _id: serviceData.createdBy._id,
        id: serviceData.createdBy._id,
        firstName: serviceData.createdBy.firstName,
        lastName: serviceData.createdBy.lastName,
        email: serviceData.createdBy.email || '',
        name: serviceData.createdBy.name || 
              (serviceData.createdBy.firstName && serviceData.createdBy.lastName 
                ? `${serviceData.createdBy.firstName} ${serviceData.createdBy.lastName}` 
                : serviceData.createdBy.email || 'Unknown')
      };
    }
    
    return {
      _id: id,
      id: id,
      serviceCode: serviceData.serviceCode || `SRV-${id.slice(-6).toUpperCase()}`,
      name: serviceData.name || 'Unnamed Service',
      description: serviceData.description || '',
      type: serviceData.type || 'custom',
      tags: serviceData.tags || [],
      status: serviceData.status || (serviceData.isActive === false ? 'inactive' : 'active'),
      isActive: serviceData.isActive !== false,
      version: serviceData.version || 1,
      createdBy: createdBy,
      internalNotes: serviceData.internalNotes,
      serviceNotes: serviceData.serviceNotes || [],
      createdAt: serviceData.createdAt,
      updatedAt: serviceData.updatedAt || serviceData.createdAt
    };
  }

  /**
   * Get services by type
   */
  async getServicesByType(type: string): Promise<Service[]> {
    try {
      const services = await this.getAllServices({ type });
      return services.filter(service => service.type === type);
    } catch (error) {
      console.error(`Error fetching services with type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get services by status
   */
  async getServicesByStatus(status: string): Promise<Service[]> {
    try {
      const services = await this.getAllServices({ status });
      return services.filter(service => service.status === status);
    } catch (error) {
      console.error(`Error fetching services with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get active services only
   */
  async getActiveServices(): Promise<Service[]> {
    try {
      const services = await this.getAllServices();
      return services.filter(service => service.isActive);
    } catch (error) {
      console.error('Error fetching active services:', error);
      throw error;
    }
  }

  /**
   * Get services by tags
   */
  async getServicesByTags(tags: string[]): Promise<Service[]> {
    try {
      const services = await this.getAllServices();
      return services.filter(service => 
        tags.some(tag => service.tags.includes(tag))
      );
    } catch (error) {
      console.error('Error fetching services by tags:', error);
      throw error;
    }
  }

  /**
   * Search services by name or code
   */
  async searchServicesByNameOrCode(searchTerm: string): Promise<Service[]> {
    try {
      const services = await this.getAllServices();
      const term = searchTerm.toLowerCase();
      return services.filter(service => 
        service.name.toLowerCase().includes(term) ||
        service.serviceCode.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching services:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    discontinued: number;
    byType: Record<string, number>;
    byTag: Record<string, number>;
  }> {
    try {
      const services = await this.getAllServices();
      
      const byType: Record<string, number> = {};
      const byTag: Record<string, number> = {};
      
      let active = 0;
      let inactive = 0;
      let discontinued = 0;
      
      services.forEach(service => {
        // Count by status
        if (service.status === 'active') active++;
        else if (service.status === 'inactive') inactive++;
        else if (service.status === 'discontinued') discontinued++;
        
        // Count by type
        byType[service.type] = (byType[service.type] || 0) + 1;
        
        // Count by tags
        service.tags.forEach(tag => {
          byTag[tag] = (byTag[tag] || 0) + 1;
        });
      });
      
      return {
        total: services.length,
        active,
        inactive,
        discontinued,
        byType,
        byTag,
      };
    } catch (error) {
      console.error('Error calculating service statistics:', error);
      throw error;
    }
  }

  /**
   * Get service type color for UI
   */
  getTypeColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'repair': return 'warning';
      case 'maintenance': return 'primary';
      case 'inspection': return 'info';
      case 'installation': return 'success';
      case 'custom': return 'secondary';
      default: return 'default';
    }
  }

  /**
   * Get service type text for UI
   */
  getTypeText(type: string): string {
    switch (type?.toLowerCase()) {
      case 'repair': return 'Repair';
      case 'maintenance': return 'Maintenance';
      case 'inspection': return 'Inspection';
      case 'installation': return 'Installation';
      case 'custom': return 'Custom';
      default: return type || 'Unknown';
    }
  }

  /**
   * Get service status color for UI
   */
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'discontinued': return 'error';
      default: return 'default';
    }
  }

  /**
   * Get service status text for UI
   */
  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'discontinued': return 'Discontinued';
      default: return status || 'Unknown';
    }
  }

  /**
   * Get service status icon
   */
  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return '✅';
      case 'inactive': return '⏸️';
      case 'discontinued': return '❌';
      default: return '📋';
    }
  }

  /**
   * Format service for select dropdown
   */
  formatServiceForSelect(service: Service): { value: string; label: string; data?: Service } {
    return {
      value: service.id,
      label: `${service.serviceCode} - ${service.name}`,
      data: service
    };
  }

  /**
   * Get services for select dropdown
   */
  async getServicesForSelect(): Promise<Array<{ value: string; label: string; data?: Service }>> {
    try {
      const services = await this.getActiveServices();
      return services.map(service => this.formatServiceForSelect(service));
    } catch (error) {
      console.error('Error getting services for select:', error);
      throw error;
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  /**
   * Update service status (wrapper for updateService)
   */
  async updateServiceStatus(id: string, status: string): Promise<Service> {
    return this.updateService(id, { 
      status: status as any,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined
    });
  }

  /**
   * Toggle service active status
   */
  async toggleServiceStatus(id: string): Promise<Service> {
    try {
      const service = await this.getServiceById(id);
      const newStatus = service.isActive ? 'inactive' : 'active';
      return this.updateServiceStatus(id, newStatus);
    } catch (error) {
      console.error(`Error toggling service ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Add tag to service
   */
  async addServiceTag(id: string, tag: string): Promise<Service> {
    try {
      const service = await this.getServiceById(id);
      const tags = [...new Set([...service.tags, tag])];
      return this.updateService(id, { tags });
    } catch (error) {
      console.error(`Error adding tag to service ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove tag from service
   */
  async removeServiceTag(id: string, tag: string): Promise<Service> {
    try {
      const service = await this.getServiceById(id);
      const tags = service.tags.filter(t => t !== tag);
      return this.updateService(id, { tags });
    } catch (error) {
      console.error(`Error removing tag from service ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add note to service
   */
  async addServiceNote(id: string, note: string): Promise<Service> {
    try {
      const service = await this.getServiceById(id);
      const serviceNotes = [...(service.serviceNotes || []), note];
      return this.updateService(id, { serviceNotes });
    } catch (error) {
      console.error(`Error adding note to service ${id}:`, error);
      throw error;
    }
  }

  /**
   * Validate service data
   */
  validateServiceData(data: CreateServiceData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.serviceCode?.trim()) {
      errors.push('Service code is required');
    }
    
    if (!data.name?.trim()) {
      errors.push('Service name is required');
    }
    
    if (!data.description?.trim()) {
      errors.push('Description is required');
    }
    
    if (!data.type) {
      errors.push('Service type is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const serviceService = new ServiceService();

// Service constants
export const SERVICE_TYPES = {
  REPAIR: 'repair',
  MAINTENANCE: 'maintenance',
  INSPECTION: 'inspection',
  INSTALLATION: 'installation',
  CUSTOM: 'custom',
};

export const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
};

// Helper function to create a service status checker
export const createServiceStatusChecker = (service: Service) => {
  return {
    isActive: () => service.status === SERVICE_STATUS.ACTIVE,
    isInactive: () => service.status === SERVICE_STATUS.INACTIVE,
    isDiscontinued: () => service.status === SERVICE_STATUS.DISCONTINUED,
    getStatusColor: () => serviceService.getStatusColor(service.status),
    getStatusText: () => serviceService.getStatusText(service.status),
    getStatusIcon: () => serviceService.getStatusIcon(service.status),
    getTypeColor: () => serviceService.getTypeColor(service.type),
    getTypeText: () => serviceService.getTypeText(service.type),
  };
};