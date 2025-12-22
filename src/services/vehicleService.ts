import { apiClient } from '@/lib/api/client';

export interface VehicleImage {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  isPrimary: boolean;
}

export interface Vehicle {
  id: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  mileage?: number;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg';
  transmission?: 'manual' | 'automatic' | 'semi-automatic';
  engineSize?: string;
  condition?: 'new' | 'used' | 'reconditioned';
  status?: 'available' | 'sold' | 'reserved' | 'in_service' | 'awaiting_parts';
  images: VehicleImage[];
  opportunityId?: string;
  customerId?: string;
  notes?: string;
  purchasePrice?: number;
  currentValue?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  serviceHistory?: ServiceRecord[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  mileage: number;
  serviceType: string;
  description: string;
  cost: number;
  garageName?: string;
  technician?: string;
  notes?: string;
}

export interface CreateVehicleData {
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  mileage?: number;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg';
  transmission?: 'manual' | 'automatic' | 'semi-automatic';
  engineSize?: string;
  condition?: 'new' | 'used' | 'reconditioned';
  status?: 'available' | 'sold' | 'reserved' | 'in_service' | 'awaiting_parts';
  images?: Omit<VehicleImage, 'isPrimary'>[];
  opportunityId?: string;
  customerId?: string;
  notes?: string;
  purchasePrice?: number;
  currentValue?: number;
}

export interface UpdateVehicleData {
  vin?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg';
  transmission?: 'manual' | 'automatic' | 'semi-automatic';
  engineSize?: string;
  condition?: 'new' | 'used' | 'reconditioned';
  status?: 'available' | 'sold' | 'reserved' | 'in_service' | 'awaiting_parts';
  notes?: string;
  purchasePrice?: number;
  currentValue?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
}

export interface VehicleFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  make?: string;
  model?: string;
  year?: number;
  minYear?: number;
  maxYear?: number;
  color?: string;
  status?: string;
  condition?: string;
  fuelType?: string;
  minMileage?: number;
  maxMileage?: number;
  opportunityId?: string;
  customerId?: string;
  sort?: string;
  sortBy?: string;
}

export interface VehicleStats {
  total: number;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  byMake: Record<string, number>;
  totalValue: number;
  averageMileage: number;
  upcomingServices: number;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: VehicleStats;
}

export interface AddImagesData {
  images: Omit<VehicleImage, 'isPrimary'>[];
}

export interface SetPrimaryImageData {
  imageUrl: string;
}

class VehicleService {
  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    try {
      return await apiClient.post<CreateVehicleData, Vehicle>('/vehicles', data);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // In vehicleService.ts, add logging:
    async getAllVehicles(params?: VehicleFilterParams): Promise<Vehicle[]> {
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
        const endpoint = `/vehicles${queryString ? `?${queryString}` : ''}`;
        const vehicles = await apiClient.get<Vehicle[]>(endpoint);
        
        vehicles.forEach((v, i) => {
        });
        
        return vehicles;
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
    }
    }

  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      return await apiClient.get<Vehicle>(`/vehicles/${id}`);
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  }

  async getVehiclesByOpportunity(opportunityId: string): Promise<Vehicle[]> {
    try {
      return await apiClient.get<Vehicle[]>(`/vehicles/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error fetching vehicles for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async updateVehicle(id: string, data: UpdateVehicleData): Promise<Vehicle> {
    try {
      return await apiClient.put<UpdateVehicleData, Vehicle>(`/vehicles/${id}`, data);
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  }

  async deleteVehicle(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/vehicles/${id}`);
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  }

  async addImages(id: string, data: AddImagesData): Promise<Vehicle> {
    try {
      return await apiClient.post<AddImagesData, Vehicle>(`/vehicles/${id}/images`, data);
    } catch (error) {
      console.error(`Error adding images to vehicle ${id}:`, error);
      throw error;
    }
  }

  async removeImage(id: string, imageUrl: string): Promise<Vehicle> {
    try {
      return await apiClient.delete<Vehicle>(`/vehicles/${id}/images/${encodeURIComponent(imageUrl)}`);
    } catch (error) {
      console.error(`Error removing image from vehicle ${id}:`, error);
      throw error;
    }
  }

  async setPrimaryImage(id: string, imageUrl: string): Promise<Vehicle> {
    try {
      return await apiClient.put<SetPrimaryImageData, Vehicle>(`/vehicles/${id}/images/primary`, { imageUrl });
    } catch (error) {
      console.error(`Error setting primary image for vehicle ${id}:`, error);
      throw error;
    }
  }

  async uploadImage(file: File): Promise<VehicleImage> {
    try {
      // In a real implementation, you would upload to cloud storage
      // This is a mock implementation
      const mockImage: VehicleImage = {
        url: URL.createObjectURL(file),
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        isPrimary: false
      };
      
      return mockImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async getVehicleStats(): Promise<VehicleStats> {
    try {
      // Mock stats - in real implementation, this would come from API
      return {
        total: 0,
        byStatus: {},
        byCondition: {},
        byMake: {},
        totalValue: 0,
        averageMileage: 0,
        upcomingServices: 0
      };
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      throw error;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatMileage(mileage: number): string {
    return new Intl.NumberFormat('en-US').format(mileage) + ' km';
  }

  getVehicleTitle(vehicle: Vehicle): string {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }

  getVehicleSubtitle(vehicle: Vehicle): string {
    return `${vehicle.color} • ${vehicle.registrationNumber} • ${vehicle.vin}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'in_service': return 'bg-purple-100 text-purple-800';
      case 'awaiting_parts': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getConditionColor(condition: string): string {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-yellow-100 text-yellow-800';
      case 'reconditioned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getFuelTypeIcon(fuelType: string): string {
    switch (fuelType) {
      case 'petrol': return '⛽';
      case 'diesel': return '⛽';
      case 'electric': return '⚡';
      case 'hybrid': return '🔋';
      case 'cng': return '🔥';
      case 'lpg': return '🔥';
      default: return '⛽';
    }
  }

  getTransmissionIcon(transmission: string): string {
    switch (transmission) {
      case 'manual': return '🚗';
      case 'automatic': return '🚙';
      case 'semi-automatic': return '🏎️';
      default: return '🚗';
    }
  }

  calculateAge(year: number): number {
    return new Date().getFullYear() - year;
  }

  isServiceDue(nextServiceDate?: string): boolean {
    if (!nextServiceDate) return false;
    return new Date(nextServiceDate) <= new Date();
  }

  daysUntilService(nextServiceDate?: string): number {
    if (!nextServiceDate) return 0;
    const due = new Date(nextServiceDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const vehicleService = new VehicleService();