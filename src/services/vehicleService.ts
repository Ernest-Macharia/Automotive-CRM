// src/services/vehicleService.ts
import { apiClient } from '@/lib/api/client';

export interface VehicleImage {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  isPrimary: boolean;
}

export interface Vehicle {
  _id?: string;
  id?: string;
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
  ownerId?: string;
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

// Custom client wrapper to handle FormData properly
const vehicleApiClient = {
  post: async <T, R>(url: string, data: T, config?: any): Promise<R> => {
    return apiClient.post<T, R>(url, data);
  },
  
  put: async <T, R>(url: string, data: T, config?: any): Promise<R> => {
    return apiClient.put<T, R>(url, data);
  },
  
  get: async <R>(url: string): Promise<R> => {
    return apiClient.get<R>(url);
  },
  
  delete: async <R>(url: string): Promise<R> => {
    return apiClient.delete<R>(url);
  }
};

class VehicleService {
  // POST /api/v1/vehicles - Create a new vehicle
  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    try {
      return await vehicleApiClient.post<CreateVehicleData, Vehicle>('/vehicles', data);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // GET /api/v1/vehicles - Get all vehicles
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
      return await vehicleApiClient.get<Vehicle[]>(endpoint);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // GET /api/v1/vehicles/opportunity/{opportunityId} - Get vehicles by opportunity ID
  async getVehiclesByOpportunity(opportunityId: string): Promise<Vehicle[]> {
    try {
      return await vehicleApiClient.get<Vehicle[]>(`/vehicles/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error fetching vehicles for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/vehicles/{id} - Get a vehicle by ID
  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      return await vehicleApiClient.get<Vehicle>(`/vehicles/${id}`);
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  }

  // PUT /api/v1/vehicles/{id} - Update a vehicle
  async updateVehicle(id: string, data: UpdateVehicleData): Promise<Vehicle> {
    try {
      return await vehicleApiClient.put<UpdateVehicleData, Vehicle>(`/vehicles/${id}`, data);
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/vehicles/{id} - Delete a vehicle
  async deleteVehicle(id: string): Promise<{ message: string }> {
    try {
      return await vehicleApiClient.delete<{ message: string }>(`/vehicles/${id}`);
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/vehicles/{id}/images - Add images to a vehicle
  async addImages(id: string, data: AddImagesData): Promise<Vehicle> {
    try {
      return await vehicleApiClient.post<AddImagesData, Vehicle>(`/vehicles/${id}/images`, data);
    } catch (error) {
      console.error(`Error adding images to vehicle ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/vehicles/{id}/images/{imageUrl} - Remove an image from a vehicle
  async removeImage(id: string, imageUrl: string): Promise<Vehicle> {
    try {
      const encodedImageUrl = encodeURIComponent(imageUrl);
      return await vehicleApiClient.delete<Vehicle>(`/vehicles/${id}/images/${encodedImageUrl}`);
    } catch (error) {
      console.error(`Error removing image from vehicle ${id}:`, error);
      throw error;
    }
  }

  // PUT /api/v1/vehicles/{id}/images/primary - Set primary image for a vehicle
  async setPrimaryImage(id: string, imageUrl: string): Promise<Vehicle> {
    try {
      return await vehicleApiClient.put<SetPrimaryImageData, Vehicle>(
        `/vehicles/${id}/images/primary`, 
        { imageUrl }
      );
    } catch (error) {
      console.error(`Error setting primary image for vehicle ${id}:`, error);
      throw error;
    }
  }

  // GET /api/v1/vehicles/{id}/images - Get all images for a vehicle
  async getVehicleImages(id: string): Promise<VehicleImage[]> {
    try {
      return await vehicleApiClient.get<VehicleImage[]>(`/vehicles/${id}/images`);
    } catch (error) {
      console.error(`Error fetching images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/vehicles/{id}/upload-images - Upload images to a vehicle via multipart form data
  async uploadVehicleImages(id: string, files: File[]): Promise<Vehicle> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      return await vehicleApiClient.post<FormData, Vehicle>(
        `/vehicles/${id}/upload-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error) {
      console.error(`Error uploading images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/vehicles/{id}/images/{filename} - Delete a specific image file from a vehicle
  async deleteVehicleImageFile(id: string, filename: string): Promise<{ message: string }> {
    try {
      const encodedFilename = encodeURIComponent(filename);
      return await vehicleApiClient.delete<{ message: string }>(`/vehicles/${id}/images/${encodedFilename}`);
    } catch (error) {
      console.error(`Error deleting image file ${filename} from vehicle ${id}:`, error);
      throw error;
    }
  }

  // Vehicle stats method
  async getVehicleStats(): Promise<VehicleStats> {
    try {
      // This would typically call a dedicated stats endpoint
      // For now, we'll fetch all vehicles and calculate stats
      const vehicles = await this.getAllVehicles();
      
      const stats: VehicleStats = {
        total: vehicles.length,
        byStatus: {},
        byCondition: {},
        byMake: {},
        totalValue: 0,
        averageMileage: 0,
        upcomingServices: 0
      };

      let totalMileage = 0;
      let mileageCount = 0;
      const now = new Date();

      vehicles.forEach(vehicle => {
        // Count by status
        if (vehicle.status) {
          stats.byStatus[vehicle.status] = (stats.byStatus[vehicle.status] || 0) + 1;
        }

        // Count by condition
        if (vehicle.condition) {
          stats.byCondition[vehicle.condition] = (stats.byCondition[vehicle.condition] || 0) + 1;
        }

        // Count by make
        stats.byMake[vehicle.make] = (stats.byMake[vehicle.make] || 0) + 1;

        // Calculate total value
        if (vehicle.currentValue) {
          stats.totalValue += vehicle.currentValue;
        }

        // Calculate average mileage
        if (vehicle.mileage) {
          totalMileage += vehicle.mileage;
          mileageCount++;
        }

        // Count upcoming services
        if (vehicle.nextServiceDate) {
          const dueDate = new Date(vehicle.nextServiceDate);
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 30 && daysUntil > 0) {
            stats.upcomingServices++;
          }
        }
      });

      stats.averageMileage = mileageCount > 0 ? totalMileage / mileageCount : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      throw error;
    }
  }

  // Utility methods with proper null/undefined handling
  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatMileage(mileage?: number): string {
    if (mileage === undefined || mileage === null) return '0 km';
    return new Intl.NumberFormat('en-US').format(mileage) + ' km';
  }

  getVehicleTitle(vehicle: Vehicle): string {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }

  getVehicleSubtitle(vehicle: Vehicle): string {
    const parts = [
      vehicle.color,
      vehicle.registrationNumber,
      vehicle.vin
    ].filter(Boolean);
    return parts.join(' • ');
  }

  getStatusColor(status?: string): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'in_service': return 'bg-purple-100 text-purple-800';
      case 'awaiting_parts': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getConditionColor(condition?: string): string {
    if (!condition) return 'bg-gray-100 text-gray-800';
    switch (condition.toLowerCase()) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-yellow-100 text-yellow-800';
      case 'reconditioned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getFuelTypeIcon(fuelType?: string): string {
    if (!fuelType) return '⛽';
    switch (fuelType.toLowerCase()) {
      case 'petrol': return '⛽';
      case 'diesel': return '⛽';
      case 'electric': return '⚡';
      case 'hybrid': return '🔋';
      case 'cng': return '🔥';
      case 'lpg': return '🔥';
      default: return '⛽';
    }
  }

  getTransmissionIcon(transmission?: string): string {
    if (!transmission) return '🚗';
    switch (transmission.toLowerCase()) {
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

  // Helper method to get primary image URL
  getPrimaryImage(vehicle: Vehicle): string | null {
    if (!vehicle.images || vehicle.images.length === 0) return null;
    const primary = vehicle.images.find(img => img.isPrimary);
    return primary ? primary.url : vehicle.images[0].url;
  }

  // Helper method to validate VIN
  validateVIN(vin: string): boolean {
    // Basic VIN validation (17 characters, alphanumeric)
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
  }

  // Helper method to validate registration number
  validateRegistrationNumber(regNumber: string): boolean {
    // Basic validation for alphanumeric with possible spaces/dashes
    return /^[A-Z0-9][A-Z0-9\s\-]*[A-Z0-9]$/.test(regNumber);
  }

  // Get available makes (could be populated from backend or static list)
  getAvailableMakes(): string[] {
    return [
      'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz',
      'Audi', 'Volkswagen', 'Nissan', 'Mazda', 'Subaru',
      'Chevrolet', 'Hyundai', 'Kia', 'Volvo', 'Lexus'
    ];
  }

  // Get available colors
  getAvailableColors(): string[] {
    return [
      'Red', 'Blue', 'Black', 'White', 'Silver',
      'Gray', 'Green', 'Yellow', 'Orange', 'Brown',
      'Purple', 'Gold', 'Beige', 'Maroon', 'Navy'
    ];
  }

  // Get available statuses
  getAvailableStatuses(): string[] {
    return ['available', 'sold', 'reserved', 'in_service', 'awaiting_parts'];
  }

  // Get available conditions
  getAvailableConditions(): string[] {
    return ['new', 'used', 'reconditioned'];
  }

  // Get available fuel types
  getAvailableFuelTypes(): string[] {
    return ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'];
  }

  // Get available transmission types
  getAvailableTransmissions(): string[] {
    return ['manual', 'automatic', 'semi-automatic'];
  }
}

export const vehicleService = new VehicleService();