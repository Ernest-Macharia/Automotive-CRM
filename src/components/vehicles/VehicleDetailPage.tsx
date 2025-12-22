'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Upload,
  Share2,
  Printer,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Palette,
  DollarSign,
  MapPin,
  Users,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Battery,
  Shield,
  Sparkles,
  ChevronRight,
  Star,
  Image as ImageIcon,
  Copy,
  Eye,
  MoreVertical,
  CarFront,
  ClipboardCheck,
  BadgeCheck,
  Heart,
  Maximize2,
  Award,
  Target,
  Zap,
  Layers,
  FileText,
  BarChart3,
  Plus
} from 'lucide-react';
import { vehicleService, Vehicle, ServiceRecord } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface VehicleDetailPageProps {
  id: string;
}

export default function VehicleDetailPage({ id }: VehicleDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicleById(id);
      setVehicle(data);
      
      // Find primary image
      const primary = data.images.find(img => img.isPrimary);
      if (primary) {
        setPrimaryImage(primary.url);
      } else if (data.images.length > 0) {
        setPrimaryImage(data.images[0].url);
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      showToast('Failed to load vehicle details', 'error');
      router.push('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    
    if (!confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`)) return;
    
    try {
      await vehicleService.deleteVehicle(vehicle.id);
      showToast('Vehicle deleted successfully', 'success');
      router.push('/vehicles');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showToast('Failed to delete vehicle', 'error');
    }
  };

  const handleCopyVIN = () => {
    if (!vehicle) return;
    
    navigator.clipboard.writeText(vehicle.vin);
    showToast('VIN copied to clipboard', 'success');
  };

  const handleSetPrimaryImage = async (imageUrl: string) => {
    if (!vehicle) return;
    
    try {
      const updatedVehicle = await vehicleService.setPrimaryImage(vehicle.id, imageUrl);
      setVehicle(updatedVehicle);
      setPrimaryImage(imageUrl);
      showToast('Primary image updated', 'success');
    } catch (error) {
      console.error('Error setting primary image:', error);
      showToast('Failed to update primary image', 'error');
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!vehicle) return;
    
    if (!confirm('Are you sure you want to remove this image?')) return;
    
    try {
      const updatedVehicle = await vehicleService.removeImage(vehicle.id, imageUrl);
      setVehicle(updatedVehicle);
      
      // Update primary image if needed
      if (imageUrl === primaryImage) {
        const newPrimary = updatedVehicle.images.find(img => img.isPrimary);
        setPrimaryImage(newPrimary?.url || null);
      }
      
      showToast('Image removed successfully', 'success');
    } catch (error) {
      console.error('Error removing image:', error);
      showToast('Failed to remove image', 'error');
    }
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
    showToast(favorite ? 'Removed from favorites' : 'Added to favorites', 'success');
  };

  const isServiceDue = vehicle ? vehicleService.isServiceDue(vehicle.nextServiceDate) : false;
  const daysUntilService = vehicle ? vehicleService.daysUntilService(vehicle.nextServiceDate) : 0;
  const vehicleAge = vehicle ? vehicleService.calculateAge(vehicle.year) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading luxury vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
        <div className="text-center">
          <Car className="h-20 w-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Vehicle Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md">The requested vehicle could not be found in our luxury collection.</p>
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Return to Vehicle Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-black opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070')] bg-cover bg-center opacity-20"></div>
        <div className="relative px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/vehicles"
                  className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Car className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{vehicle.make} {vehicle.model}</h1>
                  <p className="text-white/80 flex items-center gap-2">
                    <span>{vehicle.year}</span>
                    <span>•</span>
                    <span>{vehicle.registrationNumber}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicleService.getStatusColor(vehicle.status || 'available')}`}>
                      {vehicle.status?.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') || 'Available'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFavorite}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all"
                  title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-5 w-5 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-sm text-white/80">CURRENT VALUE</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {vehicle.currentValue ? vehicleService.formatCurrency(vehicle.currentValue) : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-sm text-white/80">MILEAGE</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {vehicle.mileage ? vehicleService.formatMileage(vehicle.mileage) : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-sm text-white/80">AGE</p>
                <p className="text-2xl font-bold text-white mt-1">{vehicleAge} years</p>
              </div>
              
              <div className={`backdrop-blur-md rounded-xl p-4 border ${
                isServiceDue 
                  ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 border-red-400/30' 
                  : 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 border-emerald-400/30'
              }`}>
                <p className="text-sm text-white/80">NEXT SERVICE</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xl font-bold text-white">
                    {vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate).toLocaleDateString() : 'Not scheduled'}
                  </p>
                  {vehicle.nextServiceDate && (
                    <span className={`text-sm font-medium ${isServiceDue ? 'text-red-300' : 'text-emerald-300'}`}>
                      {isServiceDue ? 'OVERDUE' : `${daysUntilService} days`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Premium Image Gallery */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Primary Image */}
              <div className="relative h-[500px] bg-gradient-to-br from-gray-900 to-black">
                {primaryImage ? (
                  <>
                    <img
                      src={primaryImage}
                      alt={vehicle.model}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-30 rounded-full"></div>
                      <Car className="h-32 w-32 text-white/40 relative" />
                    </div>
                  </div>
                )}
                
                {/* Image Controls */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                    <Maximize2 className="h-5 w-5" />
                  </button>
                  <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Image Counter */}
                {vehicle.images.length > 0 && (
                  <div className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                    <p className="text-white text-sm font-medium">
                      {vehicle.images.findIndex(img => img.url === primaryImage) + 1} of {vehicle.images.length}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {vehicle.images.length > 1 && (
                <div className="p-6 border-t border-gray-100">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {vehicle.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group flex-shrink-0"
                      >
                        <div
                          className={`w-24 h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                            image.url === primaryImage 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setPrimaryImage(image.url)}
                        >
                          <img
                            src={image.url}
                            alt={`${vehicle.model} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {image.url === primaryImage && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              <Star className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimaryImage(image.url);
                            }}
                            className="p-1.5 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(image.url, '_blank');
                            }}
                            className="p-1.5 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                            title="View full size"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Premium Tabs */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100">
                <nav className="flex">
                  {['overview', 'specifications', 'service', 'documents', 'history'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-8 py-5 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                        activeTab === tab
                          ? 'text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab === 'overview' && <Eye className="h-4 w-4" />}
                      {tab === 'specifications' && <Settings className="h-4 w-4" />}
                      {tab === 'service' && <Wrench className="h-4 w-4" />}
                      {tab === 'documents' && <FileText className="h-4 w-4" />}
                      {tab === 'history' && <BarChart3 className="h-4 w-4" />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Vehicle Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider">IDENTIFICATION</p>
                            <div className="mt-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">VIN</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{vehicle.vin}</span>
                                  <button
                                    onClick={handleCopyVIN}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Copy VIN"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Registration</span>
                                <span className="font-semibold text-gray-900">{vehicle.registrationNumber}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider">BASICS</p>
                            <div className="mt-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Make & Model</span>
                                <span className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Year</span>
                                <span className="font-semibold text-gray-900">{vehicle.year}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Color</span>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: vehicle.color.toLowerCase() }}
                                  ></div>
                                  <span className="font-semibold text-gray-900">{vehicle.color}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider">CONDITION & STATUS</p>
                            <div className="mt-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Condition</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vehicleService.getConditionColor(vehicle.condition || 'used')}`}>
                                  {vehicle.condition || 'Used'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vehicleService.getStatusColor(vehicle.status || 'available')}`}>
                                  {vehicle.status?.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ') || 'Available'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Created</span>
                                <span className="font-semibold text-gray-900">
                                  {new Date(vehicle.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {vehicle.notes && (
                            <div>
                              <p className="text-sm text-gray-500 uppercase tracking-wider">NOTES</p>
                              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-700">{vehicle.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <p className="text-sm text-blue-700 font-medium">Fuel Type</p>
                        <p className="text-lg font-bold text-blue-900 mt-1">{vehicle.fuelType?.toUpperCase() || 'N/A'}</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl">
                        <p className="text-sm text-emerald-700 font-medium">Transmission</p>
                        <p className="text-lg font-bold text-emerald-900 mt-1">{vehicle.transmission?.toUpperCase() || 'N/A'}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <p className="text-sm text-purple-700 font-medium">Engine</p>
                        <p className="text-lg font-bold text-purple-900 mt-1">{vehicle.engineSize || 'N/A'}</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl">
                        <p className="text-sm text-amber-700 font-medium">Age</p>
                        <p className="text-lg font-bold text-amber-900 mt-1">{vehicleAge} years</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Specifications Tab */}
                {activeTab === 'specifications' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-gray-900">Technical Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                              <Gauge className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-700 font-medium">Mileage & Performance</p>
                              <p className="text-2xl font-bold text-blue-900 mt-1">
                                {vehicle.mileage ? vehicleService.formatMileage(vehicle.mileage) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500">
                              <Fuel className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-emerald-700 font-medium">Fuel System</p>
                              <p className="text-2xl font-bold text-emerald-900 mt-1">{vehicle.fuelType?.toUpperCase() || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                              <Settings className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-purple-700 font-medium">Transmission</p>
                              <p className="text-2xl font-bold text-purple-900 mt-1">{vehicle.transmission?.toUpperCase() || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500">
                              <Battery className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-amber-700 font-medium">Engine Details</p>
                              <p className="text-2xl font-bold text-amber-900 mt-1">{vehicle.engineSize || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Service Tab */}
                {activeTab === 'service' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Service & Maintenance</h3>
                      
                      {/* Service Status Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className={`rounded-2xl p-6 border ${
                          isServiceDue 
                            ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
                            : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-xl ${
                                isServiceDue 
                                  ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
                              }`}>
                                <Calendar className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-medium">Next Service</p>
                                <p className="text-2xl font-bold mt-1">
                                  {vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate).toLocaleDateString() : 'Not scheduled'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-lg font-bold ${
                              isServiceDue ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {isServiceDue ? 'OVERDUE' : `${daysUntilService} days`}
                            </span>
                          </div>
                          {isServiceDue && (
                            <Link
                              href={`/vehicles/${vehicle.id}/service`}
                              className="inline-flex items-center gap-2 text-red-600 font-medium hover:text-red-700"
                            >
                              <Wrench className="h-4 w-4" />
                              Schedule Service Now
                            </Link>
                          )}
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                              <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">Last Service</p>
                              <p className="text-2xl font-bold mt-1">
                                {vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Service History */}
                      {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 ? (
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Service History</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Service Type</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mileage</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cost</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Garage</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {vehicle.serviceHistory.map((record, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{record.serviceType}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{vehicleService.formatMileage(record.mileage)}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{vehicleService.formatCurrency(record.cost)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{record.garageName || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-bold text-gray-900 mb-2">No Service Records</h4>
                          <p className="text-gray-600 mb-6">This vehicle doesn't have any service history recorded yet.</p>
                          <Link
                            href={`/vehicles/${vehicle.id}/service/add`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                          >
                            <Plus className="h-5 w-5" />
                            Add First Service Record
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Vehicle Actions</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/vehicles/${vehicle.id}/edit`}
                  className="flex items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Edit className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">Edit Vehicle</p>
                      <p className="text-sm text-blue-600">Update vehicle details</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  href={`/vehicles/${vehicle.id}/images`}
                  className="flex items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <ImageIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-700">Manage Images</p>
                      <p className="text-sm text-purple-600">Add/edit vehicle photos</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-500/20">
                      <Printer className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Print Details</p>
                      <p className="text-sm text-gray-600">Generate PDF report</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl hover:from-red-100 hover:to-red-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-700">Delete Vehicle</p>
                      <p className="text-sm text-red-600">Remove from system</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-red-600 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 text-white">
              <h3 className="text-lg font-bold text-white mb-6">Financial Summary</h3>
              
              <div className="space-y-6">
                {vehicle.purchasePrice && (
                  <div>
                    <p className="text-sm text-white/80">PURCHASE PRICE</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {vehicleService.formatCurrency(vehicle.purchasePrice)}
                    </p>
                  </div>
                )}
                
                {vehicle.currentValue && (
                  <div>
                    <p className="text-sm text-white/80">CURRENT VALUE</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent mt-1">
                      {vehicleService.formatCurrency(vehicle.currentValue)}
                    </p>
                  </div>
                )}
                
                {vehicle.purchasePrice && vehicle.currentValue && (
                  <div className="pt-6 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">Depreciation</span>
                      <span className={`text-lg font-bold ${
                        vehicle.currentValue >= vehicle.purchasePrice 
                          ? 'text-emerald-400' 
                          : 'text-red-400'
                      }`}>
                        {((vehicle.currentValue - vehicle.purchasePrice) / vehicle.purchasePrice * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${Math.max(0, Math.min(100, (vehicle.currentValue / vehicle.purchasePrice) * 100))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-white/60 mt-2">
                        <span>Purchase</span>
                        <span>Current</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opportunity Link */}
            {vehicle.opportunityId && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-3xl p-6 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Linked Opportunity</h4>
                    <p className="text-sm text-gray-600 mt-1">This vehicle is associated with a sales opportunity</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Opportunity ID</span>
                    <span className="text-sm font-medium text-gray-900">
                      {vehicle.opportunityId.substring(0, 12)}...
                    </span>
                  </div>
                  
                  <Link
                    href={`/opportunities/${vehicle.opportunityId}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    View Opportunity
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Vehicle Timeline</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Car className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute top-8 left-4 h-full w-0.5 bg-gradient-to-b from-blue-500/20 to-transparent"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Vehicle Added</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(vehicle.createdAt).toLocaleString()}
                    </p>
                    {vehicle.createdBy && (
                      <p className="text-xs text-gray-500 mt-1">By: {vehicle.createdBy}</p>
                    )}
                  </div>
                </div>
                
                {vehicle.lastServiceDate && (
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
                        <Wrench className="h-4 w-4 text-white" />
                      </div>
                      <div className="absolute top-8 left-4 h-full w-0.5 bg-gradient-to-b from-emerald-500/20 to-transparent"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Last Serviced</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(vehicle.lastServiceDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {vehicle.nextServiceDate && (
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isServiceDue 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500'
                          : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                      }`}>
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Next Service</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${
                        isServiceDue ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {isServiceDue ? 'Service overdue!' : `${daysUntilService} days remaining`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}