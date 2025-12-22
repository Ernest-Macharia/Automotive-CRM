'use client';

import { useState, useEffect } from 'react';
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
  Filter as FilterIcon,
  SortAsc,
  Grid,
  List,
  Layers
} from 'lucide-react';
import { vehicleService, Vehicle, VehicleStats } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

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

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'text-gray-600', bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600' },
    { value: 'available', label: 'Available', color: 'text-emerald-600', bgColor: 'bg-gradient-to-r from-emerald-500 to-green-500' },
    { value: 'sold', label: 'Sold', color: 'text-blue-600', bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { value: 'reserved', label: 'Reserved', color: 'text-amber-600', bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-500' },
    { value: 'in_service', label: 'In Service', color: 'text-purple-600', bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'awaiting_parts', label: 'Awaiting Parts', color: 'text-red-600', bgColor: 'bg-gradient-to-r from-red-500 to-orange-500' },
  ];

  const conditionOptions = [
    { value: 'all', label: 'All Conditions', color: 'text-gray-600' },
    { value: 'new', label: 'New', color: 'text-emerald-600' },
    { value: 'used', label: 'Used', color: 'text-amber-600' },
    { value: 'reconditioned', label: 'Reconditioned', color: 'text-blue-600' },
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

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price_high':
        return (b.currentValue || 0) - (a.currentValue || 0);
      case 'price_low':
        return (a.currentValue || 0) - (b.currentValue || 0);
      case 'mileage_low':
        return (a.mileage || 0) - (b.mileage || 0);
      case 'mileage_high':
        return (b.mileage || 0) - (a.mileage || 0);
      case 'year_new':
        return b.year - a.year;
      case 'year_old':
        return a.year - b.year;
      default:
        return 0;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      {/* Premium Header with Glass Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-black opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070')] bg-cover bg-center opacity-20"></div>
        <div className="relative px-8 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <Car className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Premium Vehicle Fleet</h1>
                  <p className="text-white/80 text-lg">Luxury automobiles curated for discerning clients</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={loadVehicles}
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all"
                  title="Refresh"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <Link
                  href="/vehicles/create"
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-xl hover:shadow-2xl"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-lg">Add Luxury Vehicle</span>
                </Link>
              </div>
            </div>

            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">Total Fleet</p>
                    <p className="text-4xl font-bold text-white mt-2">{stats?.total || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                    <Car className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <TrendingUp className="h-4 w-4" />
                    <span>+12 premium additions this month</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">Portfolio Value</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {vehicleService.formatCurrency(stats?.totalValue || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">Available</p>
                    <p className="text-4xl font-bold text-white mt-2">
                      {stats?.byStatus?.available || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/60">Ready for delivery</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/30 to-yellow-500/30 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-100">Featured Collection</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {Object.entries(stats?.byMake || {}).sort(([,a], [,b]) => b - a)[0]?.[0] || '--'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-amber-400/20">
                  <div className="flex items-center gap-2 text-sm text-amber-200">
                    <Star className="h-4 w-4" />
                    <span>Top luxury brand</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Premium Control Bar */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search for luxury vehicles by VIN, make, model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-0 focus:border-blue-500 focus:bg-white transition-all text-lg placeholder-gray-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">
                    {sortedVehicles.length} vehicles
                  </span>
                </div>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Grid View"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="List View"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 appearance-none text-sm font-medium"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <SortAsc className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Filter Button */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-md">
                <FilterIcon className="h-4 w-4" />
                <span className="font-medium">Filters</span>
              </button>
              
              {/* Clear */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                  setSelectedCondition('all');
                  setSelectedMake('all');
                  setSortBy('newest');
                }}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          
          {/* Quick Filter Chips */}
          <div className="mt-6 flex flex-wrap gap-3">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedStatus === option.value ? `${option.bgColor} text-white shadow-lg` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Luxury Vehicle Cards Grid */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}`}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : sortedVehicles.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-16 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 rounded-full"></div>
                  <Car className="h-20 w-20 text-gray-400 mx-auto mb-6 relative" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Luxury Vehicles Found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchTerm || selectedStatus !== 'all' || selectedCondition !== 'all' || selectedMake !== 'all'
                    ? 'Adjust your search criteria to find the perfect vehicle'
                    : 'Begin building your luxury vehicle portfolio'
                  }
                </p>
                <Link
                  href="/vehicles/create"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl font-bold hover:from-amber-600 hover:to-yellow-600 transition-all shadow-xl hover:shadow-2xl text-lg"
                >
                  <Plus className="h-6 w-6" />
                  Add First Luxury Vehicle
                </Link>
              </div>
            </div>
          ) : (
            sortedVehicles.map((vehicle) => {
              const primaryImage = getPrimaryImage(vehicle);
              const isServiceDue = vehicleService.isServiceDue(vehicle.nextServiceDate);
              const daysUntilService = vehicleService.daysUntilService(vehicle.nextServiceDate);
              const isFavorite = favorites.has(vehicle.id);
              const vehicleAge = vehicleService.calculateAge(vehicle.year);
              
              return viewMode === 'grid' ? (
                // Grid View Card
                <div key={vehicle.id} className="group relative">
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    {/* Image Container */}
                    <div className="relative h-72 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                      {primaryImage ? (
                        <>
                          <img
                            src={primaryImage.url}
                            alt={vehicle.model}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-30 rounded-full"></div>
                            <Car className="h-24 w-24 text-white/60 relative" />
                          </div>
                        </div>
                      )}
                      
                      {/* Premium Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md ${vehicleService.getStatusColor(vehicle.status || 'available')}`}>
                          {vehicle.status === 'available' ? <CheckCircle className="h-3 w-3" /> :
                           vehicle.status === 'in_service' ? <Wrench className="h-3 w-3" /> :
                           vehicle.status === 'reserved' ? <Clock className="h-3 w-3" /> :
                           <Car className="h-3 w-3" />}
                          {vehicle.status?.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ') || 'Available'}
                        </span>
                        
                        {vehicle.condition === 'new' && (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full text-xs font-bold backdrop-blur-md">
                            <Shield className="h-3 w-3" />
                            Brand New
                          </span>
                        )}
                      </div>
                      
                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(vehicle.id)}
                        className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
                      >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </button>
                      
                      {/* Share Button */}
                      <button className="absolute top-16 right-4 p-2.5 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
                        <Share2 className="h-5 w-5 text-white" />
                      </button>
                      
                      {/* Year Badge */}
                      <div className="absolute bottom-4 left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {vehicle.year}
                      </div>
                      
                      {/* Quick View Button */}
                      <button className="absolute bottom-4 right-4 p-3 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors shadow-lg">
                        <Maximize2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Details Container */}
                    <div className="p-6">
                      {/* Title and Price */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            {vehicle.color} • {vehicle.registrationNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          {vehicle.currentValue && (
                            <div>
                              <p className="text-xs text-gray-500">ESTIMATED VALUE</p>
                              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {vehicleService.formatCurrency(vehicle.currentValue)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200">
                            <Gauge className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">MILEAGE</p>
                            <p className="font-semibold text-gray-900">
                              {vehicle.mileage ? vehicleService.formatMileage(vehicle.mileage) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-200">
                            <Fuel className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">FUEL TYPE</p>
                            <p className="font-semibold text-gray-900">{vehicle.fuelType?.toUpperCase() || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200">
                            <Settings className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">TRANSMISSION</p>
                            <p className="font-semibold text-gray-900">{vehicle.transmission?.toUpperCase() || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-100 to-amber-200">
                            <Car className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">AGE</p>
                            <p className="font-semibold text-gray-900">{vehicleAge} year{vehicleAge !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Service Alert */}
                      {isServiceDue && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-gradient-to-r from-red-100 to-red-200">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <p className="font-medium text-red-700">Service Overdue</p>
                                <p className="text-sm text-red-600">Due {formatDate(vehicle.nextServiceDate)}</p>
                              </div>
                            </div>
                            <Link
                              href={`/vehicles/${vehicle.id}/service`}
                              className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              Schedule Now →
                            </Link>
                          </div>
                          <div className="w-full bg-red-100 rounded-full h-2">
                            <div className="h-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500"></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
                        >
                          <Eye className="h-5 w-5" />
                          View Details
                        </Link>
                        
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/vehicles/${vehicle.id}/edit`}
                            className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          
                          <button
                            onClick={() => handleDelete(vehicle.id, `${vehicle.make} ${vehicle.model}`)}
                            className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // List View Item
                <div key={vehicle.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all">
                  <div className="flex">
                    {/* Image Section */}
                    <div className="w-64 relative">
                      <div className="h-full bg-gradient-to-br from-gray-900 to-black">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={vehicle.model}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-16 w-16 text-white/40" />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${vehicleService.getStatusColor(vehicle.status || 'available')}`}>
                          {vehicle.status?.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ') || 'Available'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Details Section */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {vehicle.make} {vehicle.model} {vehicle.year}
                          </h3>
                          <div className="flex items-center gap-6 text-gray-600 mb-4">
                            <span className="flex items-center gap-2">
                              <Palette className="h-4 w-4" />
                              {vehicle.color}
                            </span>
                            <span className="flex items-center gap-2">
                              <Gauge className="h-4 w-4" />
                              {vehicle.mileage ? vehicleService.formatMileage(vehicle.mileage) : 'N/A'}
                            </span>
                            <span className="flex items-center gap-2">
                              <Fuel className="h-4 w-4" />
                              {vehicle.fuelType?.toUpperCase() || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {vehicle.currentValue && (
                            <div>
                              <p className="text-xs text-gray-500">VALUE</p>
                              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {vehicleService.formatCurrency(vehicle.currentValue)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/vehicles/${vehicle.id}`}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                          >
                            <Eye className="h-4 w-4" />
                            View Full Details
                          </Link>
                          
                          <Link
                            href={`/vehicles/${vehicle.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Share2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(vehicle.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id, `${vehicle.make} ${vehicle.model}`)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Portfolio Analytics */}
        {stats && vehicles.length > 0 && (
          <div className="mt-12 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Portfolio Analytics</h3>
                <p className="text-gray-600 mt-2">Insights into your luxury vehicle collection</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Distribution by Status</h4>
                <div className="space-y-3">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusOptions.find(s => s.value === status)?.bgColor}`}></div>
                        <span className="text-sm text-gray-600">
                          {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                        <span className="text-xs text-gray-500">
                          ({((count / stats.total) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Top Luxury Brands</h4>
                <div className="space-y-3">
                  {Object.entries(stats.byMake)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([make, count], index) => (
                      <div key={make} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                            <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{make}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Performance Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">AVERAGE VALUE</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {vehicleService.formatCurrency(stats.totalValue / stats.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">AVERAGE MILEAGE</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {vehicleService.formatMileage(stats.averageMileage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">MAINTENANCE REQUIRED</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{stats.upcomingServices} vehicles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}