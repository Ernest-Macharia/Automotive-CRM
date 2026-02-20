// src/services/vehicleService.ts
import { apiClient } from '@/lib/api/client';

export interface VehicleImage {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  isPrimary: boolean;
  uploadedAt?: string;
  uploadedBy?: string;
  caption?: string;
  tags?: string[];
}

export interface Vehicle {
  _id?: string;
  id?: string;
  vin: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  color: string;
  mileage?: number;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg';
  transmission?: 'manual' | 'automatic' | 'semi-automatic';
  engineSize?: string;
  condition?: 'new' | 'used' | 'reconditioned';
  status?: 'available' | 'sold' | 'reserved' | 'in_service' | 'awaiting_parts';
  images?: VehicleImage[];
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

export interface UploadImageResponse {
  success: boolean;
  message: string;
  image: VehicleImage;
}

export interface UpdateImageData {
  caption?: string;
  tags?: string[];
  isPrimary?: boolean;
}

class VehicleService {
  private basePath = '/vehicles';

  // Helper method to handle FormData uploads
  private async uploadFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`;
    const token = sessionStorage.getItem('accessToken');
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload Error Response:', errorText);
      
      if (response.status === 401) {
        sessionStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
      }
      
      throw new Error(`Upload Error (${response.status}): ${errorText || response.statusText}`);
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  }

  // POST /api/v1/vehicles - Create a new vehicle
  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    try {
      return await apiClient.post<CreateVehicleData, Vehicle>(this.basePath, data);
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
      const endpoint = `${this.basePath}${queryString ? `?${queryString}` : ''}`;
      return await apiClient.get<Vehicle[]>(endpoint);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // GET /api/v1/vehicles/opportunity/{opportunityId} - Get vehicles by opportunity ID
  async getVehiclesByOpportunity(opportunityId: string): Promise<Vehicle[]> {
    try {
      return await apiClient.get<Vehicle[]>(`${this.basePath}/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error fetching vehicles for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/vehicles/{id} - Get a vehicle by ID
  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      return await apiClient.get<Vehicle>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  }

  // PUT /api/v1/vehicles/{id} - Update a vehicle
  async updateVehicle(id: string, data: UpdateVehicleData): Promise<Vehicle> {
    try {
      return await apiClient.put<UpdateVehicleData, Vehicle>(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/vehicles/{id} - Delete a vehicle
  async deleteVehicle(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/vehicles/{id}/images - Add images to a vehicle via JSON data
  async addImages(id: string, data: AddImagesData): Promise<Vehicle> {
    try {
      return await apiClient.post<AddImagesData, Vehicle>(`${this.basePath}/${id}/images`, data);
    } catch (error) {
      console.error(`Error adding images to vehicle ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/vehicles/{id}/images/{imageUrl} - Remove an image from a vehicle
  async removeImage(id: string, imageUrl: string): Promise<Vehicle> {
    try {
      const encodedImageUrl = encodeURIComponent(imageUrl);
      return await apiClient.delete<Vehicle>(`${this.basePath}/${id}/images/${encodedImageUrl}`);
    } catch (error) {
      console.error(`Error removing image from vehicle ${id}:`, error);
      throw error;
    }
  }

  // PUT /api/v1/vehicles/{id}/images/primary - Set primary image for a vehicle
  async setPrimaryImage(id: string, imageUrl: string): Promise<Vehicle> {
    try {
      return await apiClient.put<SetPrimaryImageData, Vehicle>(
        `${this.basePath}/${id}/images/primary`, 
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
      return await apiClient.get<VehicleImage[]>(`${this.basePath}/${id}/images`);
    } catch (error) {
      console.error(`Error fetching images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // ============ NEW IMAGE API METHODS ============

  // POST /api/v1/vehicles/{id}/upload-images - Upload images via multipart form data
  async uploadVehicleImages(id: string, files: File[]): Promise<Vehicle> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      return await this.uploadFormData<Vehicle>(`${this.basePath}/${id}/upload-images`, formData);
    } catch (error) {
      console.error(`Error uploading images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/vehicles/{id}/upload-image - Upload single image
  async uploadImage(id: string, file: File): Promise<UploadImageResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      return await this.uploadFormData<UploadImageResponse>(`${this.basePath}/${id}/upload-image`, formData);
    } catch (error) {
      console.error(`Error uploading image for vehicle ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/vehicles/{id}/images/{imageId} - Update image metadata
  async updateImage(id: string, imageId: string, data: UpdateImageData): Promise<Vehicle> {
    try {
      return await apiClient.patch<UpdateImageData, Vehicle>(
        `${this.basePath}/${id}/images/${imageId}`,
        data
      );
    } catch (error) {
      console.error(`Error updating image ${imageId} for vehicle ${id}:`, error);
      throw error;
    }
  }

  // GET /api/v1/vehicles/{id}/images/{imageId} - Get specific image info
  async getImageInfo(id: string, imageId: string): Promise<VehicleImage> {
    try {
      return await apiClient.get<VehicleImage>(`${this.basePath}/${id}/images/${imageId}`);
    } catch (error) {
      console.error(`Error fetching image ${imageId} for vehicle ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/vehicles/{id}/images/{filename} - Delete a specific image file
  async deleteVehicleImageFile(id: string, filename: string): Promise<{ message: string }> {
    try {
      const encodedFilename = encodeURIComponent(filename);
      return await apiClient.delete<{ message: string }>(`${this.basePath}/${id}/images/file/${encodedFilename}`);
    } catch (error) {
      console.error(`Error deleting image file ${filename} from vehicle ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/vehicles/{id}/images/sort - Reorder images
  async reorderImages(id: string, imageUrls: string[]): Promise<Vehicle> {
    try {
      return await apiClient.post<{ imageUrls: string[] }, Vehicle>(
        `${this.basePath}/${id}/images/sort`,
        { imageUrls }
      );
    } catch (error) {
      console.error(`Error reordering images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // ============ BULK IMAGE OPERATIONS ============

  // POST /api/v1/vehicles/{id}/images/bulk-delete - Delete multiple images
  async bulkDeleteImages(id: string, imageUrls: string[]): Promise<Vehicle> {
    try {
      return await apiClient.post<{ imageUrls: string[] }, Vehicle>(
        `${this.basePath}/${id}/images/bulk-delete`,
        { imageUrls }
      );
    } catch (error) {
      console.error(`Error bulk deleting images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/vehicles/{id}/images/bulk-update - Update multiple images
  async bulkUpdateImages(id: string, updates: Array<{ imageUrl: string; data: UpdateImageData }>): Promise<Vehicle> {
    try {
      return await apiClient.post<{ updates: Array<{ imageUrl: string; data: UpdateImageData }> }, Vehicle>(
        `${this.basePath}/${id}/images/bulk-update`,
        { updates }
      );
    } catch (error) {
      console.error(`Error bulk updating images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // ============ IMAGE PROCESSING ============

  // POST /api/v1/vehicles/{id}/images/process - Process images (resize, compress, etc.)
  async processImages(id: string, options?: {
    resize?: { width?: number; height?: number };
    compress?: boolean;
    format?: 'webp' | 'jpeg' | 'png';
  }): Promise<Vehicle> {
    try {
      return await apiClient.post<any, Vehicle>(
        `${this.basePath}/${id}/images/process`,
        { options }
      );
    } catch (error) {
      console.error(`Error processing images for vehicle ${id}:`, error);
      throw error;
    }
  }

  // ============ UTILITY METHODS ============

  // Helper method to upload image and get direct URL
  async uploadImageToVehicle(vehicleId: string, file: File): Promise<string> {
    try {
      const response = await this.uploadImage(vehicleId, file);
      return response.image.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Helper method to download image as blob
  async downloadImage(imageUrl: string): Promise<Blob> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  // Vehicle stats method
  async getVehicleStats(): Promise<VehicleStats> {
    try {
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
        if (vehicle.status) {
          stats.byStatus[vehicle.status] = (stats.byStatus[vehicle.status] || 0) + 1;
        }

        if (vehicle.condition) {
          stats.byCondition[vehicle.condition] = (stats.byCondition[vehicle.condition] || 0) + 1;
        }

        stats.byMake[vehicle.make] = (stats.byMake[vehicle.make] || 0) + 1;

        if (vehicle.currentValue) {
          stats.totalValue += vehicle.currentValue;
        }

        if (vehicle.mileage) {
          totalMileage += vehicle.mileage;
          mileageCount++;
        }

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

  // ============ IMAGE UI HELPERS ============

  // Helper method to get primary image URL
  getPrimaryImage(vehicle: Vehicle): string | null {
    if (!vehicle.images || vehicle.images.length === 0) return null;
    const primary = vehicle.images.find(img => img.isPrimary);
    return primary ? primary.url : vehicle.images[0].url;
  }

  // Get image thumbnail URL (assuming backend provides thumbnails)
  getImageThumbnail(imageUrl: string): string {
    // This would typically append a query parameter or replace path for thumbnail
    // For now, return original URL - in production you'd implement proper thumbnail logic
    return imageUrl;
  }

  // Get image dimensions from URL (if available)
  getImageDimensions(image: VehicleImage): { width?: number; height?: number } {
    // You could extract from filename or store dimensions in metadata
    return { width: 800, height: 600 }; // Default placeholder
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get image type icon
  getImageTypeIcon(mimetype: string): string {
    if (mimetype.includes('jpeg') || mimetype.includes('jpg')) return '🖼️';
    if (mimetype.includes('png')) return '🖼️';
    if (mimetype.includes('webp')) return '🖼️';
    if (mimetype.includes('gif')) return '🎬';
    if (mimetype.includes('svg')) return '📐';
    return '📎';
  }

  // Validate image file before upload
  validateImageFile(file: File): { valid: boolean; message?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: `File too large. Maximum size: ${this.formatFileSize(maxSize)}` };
    }

    return { valid: true };
  }

  // ============ OTHER UTILITY METHODS ============

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

  validateVIN(vin: string): boolean {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
  }

  validateRegistrationNumber(regNumber: string): boolean {
    return /^[A-Z0-9][A-Z0-9\s\-]*[A-Z0-9]$/.test(regNumber);
  }

  getAvailableMakes(): string[] {
    return [
      'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz',
      'Audi', 'Volkswagen', 'Nissan', 'Mazda', 'Subaru',
      'Chevrolet', 'Hyundai', 'Kia', 'Volvo', 'Lexus'
    ];
  }

  getAvailableColors(): string[] {
    return [
      'Red', 'Blue', 'Black', 'White', 'Silver',
      'Gray', 'Green', 'Yellow', 'Orange', 'Brown',
      'Purple', 'Gold', 'Beige', 'Maroon', 'Navy'
    ];
  }

  getAvailableStatuses(): string[] {
    return ['available', 'sold', 'reserved', 'in_service', 'awaiting_parts'];
  }

  getAvailableConditions(): string[] {
    return ['new', 'used', 'reconditioned'];
  }

  getAvailableFuelTypes(): string[] {
    return ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'];
  }

  getAvailableTransmissions(): string[] {
    return ['manual', 'automatic', 'semi-automatic'];
  }
}

export const vehicleService = new VehicleService();