'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  Save,
  Upload,
  Camera,
  Palette,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
  Image as ImageIcon,
  Sparkles,
  Shield,
  MapPin,
  User,
  Building,
  ClipboardCheck
} from 'lucide-react';
import { vehicleService, CreateVehicleData, VehicleImage } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';

interface CreateVehicleFormProps {
  opportunityId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateVehicleForm({ opportunityId, onSuccess, onCancel }: CreateVehicleFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [vehicleId, setVehicleId] = useState<string>('');
  const [formData, setFormData] = useState<CreateVehicleData>({
    vin: '',
    registrationNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    mileage: 0,
    fuelType: 'petrol',
    transmission: 'automatic',
    engineSize: '',
    condition: 'used',
    status: 'available',
    images: [],
    opportunityId,
    notes: '',
    purchasePrice: 0,
    currentValue: 0
  });

  const makes = [
    'Toyota', 'Honda', 'Ford', 'Mercedes-Benz', 'BMW',
    'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia',
    'Mazda', 'Subaru', 'Lexus', 'Jeep', 'Chevrolet'
  ];

  const models: Record<string, string[]> = {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Land Cruiser'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'],
    'Ford': ['F-150', 'Explorer', 'Escape', 'Mustang', 'Ranger'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'X7'],
  };

  const colors = [
    'White', 'Black', 'Silver', 'Gray', 'Red',
    'Blue', 'Green', 'Brown', 'Yellow', 'Orange'
  ];

  const handleInputChange = (field: keyof CreateVehicleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // If vehicle hasn't been created yet, store the files temporarily
    if (!vehicleId) {
      // Store files to upload after vehicle creation
      const fileArray = Array.from(files);
      const tempImages: VehicleImage[] = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const validation = vehicleService.validateImageFile(file);
        if (!validation.valid) {
          showToast(`File ${file.name}: ${validation.message}`, 'error');
          continue;
        }
        
        // Create temporary image object (you'll need to upload later)
        const tempImage: VehicleImage = {
          url: URL.createObjectURL(file), // Temporary local URL
          filename: file.name,
          mimetype: file.type,
          size: file.size,
          isPrimary: images.length === 0,
        };
        
        tempImages.push(tempImage);
      }
      
      setImages(prev => [...prev, ...tempImages]);
      showToast('Images will be uploaded after vehicle creation', 'info');
      return;
    }

    // If vehicle already exists, upload images immediately
    const filesArray = Array.from(files);
    const validFiles: File[] = [];

    filesArray.forEach(file => {
      const validation = vehicleService.validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        showToast(`File ${file.name}: ${validation.message}`, 'error');
      }
    });

    if (validFiles.length === 0) return;

    try {
      const updatedVehicle = await vehicleService.uploadVehicleImages(vehicleId, validFiles);
      
      if (updatedVehicle.images) {
        setImages(prev => {
          const existingImages = [...prev];
          const newImages = updatedVehicle.images!.filter(newImage => 
            !existingImages.some(existing => existing.url === newImage.url)
          );
          
          // Set first new image as primary if no images exist yet
          if (existingImages.length === 0 && newImages.length > 0) {
            newImages[0].isPrimary = true;
          }
          
          return [...existingImages, ...newImages];
        });
        showToast(`${validFiles.length} image(s) uploaded successfully`, 'success');
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      showToast(`Failed to upload images: ${error.message || 'Unknown error'}`, 'error');
    }
    
    e.target.value = '';
  };

  // Update handleSubmit to create vehicle first, then upload images
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // First create the vehicle without images
      const vehicleData: CreateVehicleData = {
        ...formData,
        images: [] // Start with empty images array
      };

      const vehicle = await vehicleService.createVehicle(vehicleData);
      const createdVehicleId = vehicle.id || vehicle._id || '';
      setVehicleId(createdVehicleId); // Store the vehicle ID
      
      // Upload any pending images
      const imagesWithFiles = images.filter(img => (img as any).file);
      if (imagesWithFiles.length > 0) {
        const files = imagesWithFiles.map(img => (img as any).file);
        
        const updatedVehicle = await vehicleService.uploadVehicleImages(createdVehicleId, files);
        
        // Update images with actual URLs from server
        if (updatedVehicle.images) {
          const serverImages = updatedVehicle.images.map((img, index) => ({
            ...img,
            isPrimary: index === 0 // Set first image as primary
          }));
          
          setImages(serverImages);
          
          // Update vehicle with primary image if needed
          if (serverImages.length > 0) {
            await vehicleService.setPrimaryImage(createdVehicleId, serverImages[0].url);
          }
        }
      }
      
      showToast('Vehicle created successfully!', 'success');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/vehicles/${createdVehicleId}`);
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      showToast('Failed to create vehicle', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update handleRemoveImage to handle temporary files
  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index];
    
    // Revoke object URL if it's a temporary file
    if (imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // If we removed the primary image and there are other images, make the first one primary
    if (images[index].isPrimary && images.length > 1) {
      const newImages = [...images];
      newImages.splice(index, 1);
      newImages[0].isPrimary = true;
      setImages(newImages);
    }
  };

  const handleSetPrimary = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const validateForm = (): boolean => {
    if (!formData.vin.trim()) {
      showToast('VIN is required', 'error');
      return false;
    }

    if (!formData.registrationNumber.trim()) {
      showToast('Registration number is required', 'error');
      return false;
    }

    if (!formData.make.trim()) {
      showToast('Make is required', 'error');
      return false;
    }

    if (!formData.model.trim()) {
      showToast('Model is required', 'error');
      return false;
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      showToast('Please enter a valid year', 'error');
      return false;
    }

    if (formData.mileage && formData.mileage < 0) {
      showToast('Mileage must be positive', 'error');
      return false;
    }

    return true;
  };
  const calculateAge = () => {
    return new Date().getFullYear() - formData.year;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100">
            <Car className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vehicle Information</h2>
            <p className="text-sm text-gray-600">Basic vehicle details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VIN (Vehicle Identification Number) *
            </label>
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
              required
            />
            <p className="text-xs text-gray-500 mt-1">17-character vehicle identification number</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number *
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="KAA 123A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Make *
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.make}
                onChange={(e) => {
                  handleInputChange('make', e.target.value);
                  handleInputChange('model', ''); // Reset model when make changes
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required
              >
                <option value="">Select Make</option>
                {makes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required
                disabled={!formData.make}
              >
                <option value="">Select Model</option>
                {formData.make && models[formData.make]?.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required
              >
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {formData.year && (
              <p className="text-xs text-gray-500 mt-1">
                {calculateAge()} year{calculateAge() !== 1 ? 's' : ''} old
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color *
            </label>
            <div className="relative">
              <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required
              >
                <option value="">Select Color</option>
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100">
            <Gauge className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Technical Specifications</h2>
            <p className="text-sm text-gray-600">Vehicle technical details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mileage (km)
            </label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                value={formData.mileage}
                onChange={(e) => handleInputChange('mileage', parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Type
            </label>
            <div className="relative">
              <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.fuelType}
                onChange={(e) => handleInputChange('fuelType', e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="cng">CNG</option>
                <option value="lpg">LPG</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transmission
            </label>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.transmission}
                onChange={(e) => handleInputChange('transmission', e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="semi-automatic">Semi-Automatic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engine Size
            </label>
            <input
              type="text"
              value={formData.engineSize}
              onChange={(e) => handleInputChange('engineSize', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="2.0L"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={formData.condition}
              onChange={(e) => handleInputChange('condition', e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="reconditioned">Reconditioned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="in_service">In Service</option>
              <option value="awaiting_parts">Awaiting Parts</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100">
            <DollarSign className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Financial Information</h2>
            <p className="text-sm text-gray-600">Pricing and valuation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Price (KES)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Value (KES)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.currentValue}
                onChange={(e) => handleInputChange('currentValue', parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
            <Camera className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vehicle Images</h2>
            <p className="text-sm text-gray-600">Upload photos of the vehicle</p>
          </div>
        </div>

        {/* Image Upload Area */}
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Click to upload images</p>
                  <p className="text-sm text-gray-600 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
                <p className="text-sm text-blue-600">or drag and drop</p>
              </div>
            </label>
          </div>
        </div>

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Uploaded Images ({images.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className={`aspect-square rounded-xl overflow-hidden border-2 ${image.isPrimary ? 'border-blue-500' : 'border-gray-200'}`}>
                    <img
                      src={image.url}
                      alt={`Vehicle image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Primary
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Set as primary"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{image.filename}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200">
            <ClipboardCheck className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Additional Information</h2>
            <p className="text-sm text-gray-600">Notes and references</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Additional notes about the vehicle..."
            />
          </div>

          {opportunityId && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Linked to Opportunity</p>
                  <p className="text-xs text-blue-600">Vehicle will be associated with this opportunity</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span>* Required fields</span>
          </div>
          
          <div className="flex items-center gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Vehicle
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}