'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Fuel,
  Settings,
  RefreshCw,
  DollarSign,
  Sparkles,
  Shield,
  Wrench,
  Gauge,
  Palette,
  Star,
  Award,
  Target,
  Zap,
  ChevronRight,
  Heart,
  Share2,
  Maximize2,
  Camera,
  MapPin,
  Users,
  BarChart3,
  SortAsc,
  Grid,
  List,
  Layers,
  Loader2,
  ChevronDown,
  X,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import { vehicleService, Vehicle, VehicleStats } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// ✨ Cleaner Skeletons
const VehicleCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
    <div className="grid grid-cols-2 gap-2 mb-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 bg-gray-100 rounded"></div>
      ))}
    </div>
    <div className="flex gap-2">
      <div className="h-10 flex-1 bg-gray-200 rounded"></div>
      <div className="h-10 w-10 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function VehiclesDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [makes, setMakes] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Keep your status options — just updated UI below
  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'text-gray-600' },
    { value: 'available', label: 'Available', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'sold', label: 'Sold', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'reserved', label: 'Reserved', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'in_service', label: 'In Service', color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'awaiting_parts', label: 'Awaiting Parts', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  const conditionOptions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'reconditioned', label: 'Reconditioned' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'mileage_low', label: 'Mileage: Low to High' },
    { value: 'mileage_high', label: 'Mileage: High to Low' },
    { value: 'year_new', label: 'Year: New to Old' },
    { value: 'year_old', label: 'Year: Old to New' },
  ];

  useEffect(() => {
    loadVehicles();
    loadStats();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const vehiclesData = await vehicleService.getAllVehicles();
      setVehicles(vehiclesData);
      
      // Extract unique makes for filter
      const uniqueMakes = [...new Set(vehiclesData.map(v => v.make))].sort();
      setMakes(['all', ...uniqueMakes]);
      
      updateStats(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      showToast('Failed to load vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await vehicleService.getVehicleStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading vehicle stats:', error);
    }
  };

  const updateStats = (vehiclesData: Vehicle[]) => {
    const total = vehiclesData.length;
    const byStatus: Record<string, number> = {};
    const byCondition: Record<string, number> = {};
    const byMake: Record<string, number> = {};
    let totalValue = 0;
    let totalMileage = 0;
    let upcomingServices = 0;

    vehiclesData.forEach(vehicle => {
      // Status stats
      byStatus[vehicle.status || 'available'] = (byStatus[vehicle.status || 'available'] || 0) + 1;
      
      // Condition stats
      byCondition[vehicle.condition || 'used'] = (byCondition[vehicle.condition || 'used'] || 0) + 1;
      
      // Make stats
      byMake[vehicle.make] = (byMake[vehicle.make] || 0) + 1;
      
      // Total value
      totalValue += vehicle.currentValue || vehicle.purchasePrice || 0;
      
      // Total mileage
      totalMileage += vehicle.mileage || 0;
      
      // Upcoming services
      if (vehicle.nextServiceDate && vehicleService.isServiceDue(vehicle.nextServiceDate)) {
        upcomingServices++;
      }
    });

    setStats({
      total,
      byStatus,
      byCondition,
      byMake,
      totalValue,
      averageMileage: total > 0 ? Math.round(totalMileage / total) : 0,
      upcomingServices
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    await loadStats();
    setRefreshing(false);
    showToast('Vehicles refreshed successfully', 'success');
  };

  const handleDelete = async (vehicleId: string, vehicleName: string) => {
    if (!confirm(`Are you sure you want to delete ${vehicleName}?`)) return;
    
    try {
      await vehicleService.deleteVehicle(vehicleId);
      showToast('Vehicle deleted successfully', 'success');
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      loadStats();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showToast('Failed to delete vehicle', 'error');
    }
  };

  const toggleFavorite = (vehicleId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(vehicleId)) {
      newFavorites.delete(vehicleId);
    } else {
      newFavorites.add(vehicleId);
    }
    setFavorites(newFavorites);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.color.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus;
    const matchesCondition = selectedCondition === 'all' || vehicle.condition === selectedCondition;
    const matchesMake = selectedMake === 'all' || vehicle.make === selectedMake;

    return matchesSearch && matchesStatus && matchesCondition && matchesMake;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price_high': return (b.currentValue || 0) - (a.currentValue || 0);
      case 'price_low': return (a.currentValue || 0) - (b.currentValue || 0);
      case 'mileage_low': return (a.mileage || 0) - (b.mileage || 0);
      case 'mileage_high': return (b.mileage || 0) - (a.mileage || 0);
      case 'year_new': return b.year - a.year;
      case 'year_old': return a.year - b.year;
      default: return 0;
    }
  });

  const getPrimaryImage = (vehicle: Vehicle) => {
    const primaryImage = vehicle.images.find(img => img.isPrimary);
    return primaryImage || (vehicle.images.length > 0 ? vehicle.images[0] : null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate vehicle age
  const calculateAge = (year: number) => {
    const currentYear = new Date().getFullYear();
    return currentYear - year;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Car className="h-6 w-6 text-blue-600" />
              Vehicle Fleet
            </h1>
            <p className="text-gray-600 mt-1">Manage your vehicle inventory and sales</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/vehicles/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Add Vehicle
            </Link>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Fleet', value: stats?.total || 0, icon: Car, color: 'text-gray-600', bg: 'bg-gray-50' },
              { label: 'Portfolio Value', value: vehicleService.formatCurrency(stats?.totalValue || 0), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Available', value: stats?.byStatus?.available || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { 
                label: 'Featured Brand', 
                value: Object.entries(stats?.byMake || {}).sort(([,a], [,b]) => b - a)[0]?.[0] || '--',
                icon: Award, 
                color: 'text-purple-600', 
                bg: 'bg-purple-50' 
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                {sortedVehicles.length}
              </span>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="lg:col-span-2">
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {conditionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="lg:col-span-2">
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {makes.map(make => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>
          
          <div className="lg:col-span-2 flex gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedCondition('all');
                setSelectedMake('all');
                setSortBy('newest');
              }}
              className="flex-1 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
            <button className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Filter className="h-4 w-4 inline" />
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium ${
                selectedStatus === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles List */}
      {loading ? (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-5'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            viewMode === 'grid' ? <VehicleCardSkeleton key={i} /> : <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedVehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-5">
            <Car className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {searchTerm || selectedStatus !== 'all' || selectedCondition !== 'all' || selectedMake !== 'all'
              ? 'Try a different search term or filter'
              : 'Add your first vehicle to get started'}
          </p>
          <Link
            href="/vehicles/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Vehicle
          </Link>
        </div>
      ) : (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-5'}`}>
          {sortedVehicles.map((vehicle) => {
            const primaryImage = getPrimaryImage(vehicle);
            const isServiceDue = vehicleService.isServiceDue(vehicle.nextServiceDate);
            const isFavorite = favorites.has(vehicle.id);
            const vehicleAge = calculateAge(vehicle.year);
            
            return viewMode === 'grid' ? (
              <div key={vehicle.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt={vehicle.model}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Car className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-gray-600">{vehicle.year} • {vehicle.color}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusOptions.find(s => s.value === vehicle.status)?.bg || 'bg-gray-100'
                    }`}>
                      {vehicle.status?.replace('_', ' ') || 'Available'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5 text-gray-500" />
                      <span>{vehicle.mileage ? vehicleService.formatMileage(vehicle.mileage) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="h-3.5 w-3.5 text-gray-500" />
                      <span>{vehicle.fuelType?.toUpperCase() || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {vehicle.currentValue && (
                    <p className="text-lg font-bold text-blue-600 mb-3">
                      {vehicleService.formatCurrency(vehicle.currentValue)}
                    </p>
                  )}
                  
                  {isServiceDue && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Service overdue
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/vehicles/${vehicle.id}/edit`}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle.id, `${vehicle.make} ${vehicle.model}`)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={vehicle.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 flex-shrink-0 rounded-lg overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={vehicle.model}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-8 w-8 text-gray-400 m-auto mt-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{vehicle.make} {vehicle.model} {vehicle.year}</h3>
                        <p className="text-sm text-gray-600">{vehicle.color} • {vehicle.registrationNumber}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusOptions.find(s => s.value === vehicle.status)?.bg || 'bg-gray-100'
                      }`}>
                        {vehicle.status?.replace('_', ' ') || 'Available'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5" />
                        {vehicle.mileage ? vehicleService.formatMileage(vehicle.mileage) : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel className="h-3.5 w-3.5" />
                        {vehicle.fuelType?.toUpperCase() || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" />
                        {vehicleAge} yr{vehicleAge !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {vehicle.currentValue && (
                      <p className="text-lg font-bold text-blue-600 mb-3">
                        {vehicleService.formatCurrency(vehicle.currentValue)}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/vehicles/${vehicle.id}/edit`}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleFavorite(vehicle.id)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id, `${vehicle.make} ${vehicle.model}`)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analytics */}
      {vehicles.length > 0 && !loading && (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Portfolio Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <h4 className="text-xs text-gray-600 uppercase tracking-wider mb-3">Distribution by Status</h4>
              <div className="space-y-2">
                {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs text-gray-600 uppercase tracking-wider mb-3">Top Brands</h4>
              <div className="space-y-2">
                {Object.entries(stats?.byMake || {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([make, count]) => (
                    <div key={make} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{make}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-xs text-gray-600 uppercase tracking-wider mb-3">Performance Metrics</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">AVERAGE VALUE</p>
                  <p className="text-sm font-medium text-gray-900">
                    {vehicleService.formatCurrency((stats?.totalValue || 0) / (stats?.total || 1))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">AVERAGE MILEAGE</p>
                  <p className="text-sm font-medium text-gray-900">
                    {vehicleService.formatMileage(stats?.averageMileage || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">MAINTENANCE REQUIRED</p>
                  <p className="text-sm font-medium text-red-600">{stats?.upcomingServices || 0} vehicles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}