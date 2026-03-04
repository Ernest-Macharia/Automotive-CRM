'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings, Plus, Search, Filter, RefreshCw,
  Eye, Edit, Trash2, Tag, Clock, CheckCircle,
  AlertTriangle, User, Package, Calendar,
  Loader2, ChevronRight, AlertCircle, FileText,
  Layers, Wrench, Shield, Zap
} from 'lucide-react';
import { serviceService, Service, SERVICE_TYPES, SERVICE_STATUS } from '@/services/serviceService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="border border-gray-200 rounded-xl bg-white animate-pulse overflow-hidden flex flex-col shadow-sm">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      
      <div className="h-3 w-full bg-gray-200 rounded mb-4"></div>
      <div className="h-3 w-3/4 bg-gray-200 rounded mb-4"></div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
      <div className="h-2 w-12 bg-gray-200 rounded"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export default function ServicesList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'discontinued', label: 'Discontinued' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'repair', label: 'Repair' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'installation', label: 'Installation' },
    { value: 'custom', label: 'Custom' },
  ];

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceService.getAllServices();
      let filteredServices = response || [];
      
      if (searchTerm) {
        filteredServices = filteredServices.filter(service => 
          service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.serviceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      if (statusFilter !== 'all') {
        filteredServices = filteredServices.filter(service => service.status === statusFilter);
      }
      
      if (typeFilter !== 'all') {
        filteredServices = filteredServices.filter(service => service.type === typeFilter);
      }
      
      setServices(filteredServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await serviceService.getServiceStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchServices(), fetchStats()]);
      showToast('Services refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchStats();
  }, [fetchServices, fetchStats]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service? This will mark it as inactive.')) return;
    
    try {
      const result = await serviceService.deleteService(id);
      showToast(result.message || 'Service deleted successfully', 'success');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Failed to delete service', 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await serviceService.toggleServiceStatus(id);
      showToast('Service status updated', 'success');
      fetchServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
      showToast('Failed to update service status', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'repair': return <Wrench className="h-3.5 w-3.5" />;
      case 'maintenance': return <Settings className="h-3.5 w-3.5" />;
      case 'inspection': return <Search className="h-3.5 w-3.5" />;
      case 'installation': return <Package className="h-3.5 w-3.5" />;
      case 'custom': return <Zap className="h-3.5 w-3.5" />;
      default: return <Settings className="h-3.5 w-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    return serviceService.getTypeColor(type);
  };

  const getStatusColor = (status: string) => {
    return serviceService.getStatusColor(status);
  };

  const getStatusText = (status: string) => {
    return serviceService.getStatusText(status);
  };

  const getTypeText = (type: string) => {
    return serviceService.getTypeText(type);
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="h-16 flex items-center px-6 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Services Catalog</h1>
              <p className="text-blue-100 text-xs">Manage service offerings and configurations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-60"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/services/create"
              className="px-3 py-1.5 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Service</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl p-4 border bg-white border-gray-200 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Services', value: stats.total || 0, icon: Settings, color: '#2563eb' },
              { label: 'Active', value: stats.active || 0, icon: CheckCircle, color: '#10b981' },
              { label: 'Inactive', value: stats.inactive || 0, icon: AlertCircle, color: '#f59e0b' },
              { label: 'Discontinued', value: stats.discontinued || 0, icon: AlertTriangle, color: '#ef4444' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-bold text-gray-800">{item.value}</p>
                  </div>
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search services by name, code, or tags..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Layers className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="p-4 md:p-5">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">No services found</h3>
                <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Create your first service to add to your catalog.'}
                </p>
                <Link
                  href="/services/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Create New Service
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div 
                    key={service._id} 
                    className="border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm truncate">{service.name}</h3>
                          <p className="text-xs text-gray-500">{service.serviceCode}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(service.status)}`}>
                            {getStatusText(service.status)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(service.type)}`}>
                            {getTypeText(service.type)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {service.description}
                      </p>

                      {/* Tags */}
                      {service.tags && service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {service.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index} 
                              className={`px-2 py-0.5 rounded text-xs ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 3 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                              +{service.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="space-y-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(service.type)}
                          <span className="truncate">v{service.version}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{service.createdBy.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>{formatDate(service.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                      <button
                        onClick={() => handleToggleStatus(service._id)}
                        className={`text-xs px-2 py-1 rounded ${
                          service.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="flex gap-1.5">
                        <Link
                          href={`/services/${service._id}`}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/services/${service._id}/edit`}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Type Summary */}
        {!statsLoading && stats?.byType && (
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">Service Type Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.byType).map(([type, count]) => {
                let bgColor = 'bg-blue-100';
                if (type === 'maintenance') bgColor = 'bg-green-100';
                else if (type === 'repair') bgColor = 'bg-yellow-100';
                else if (type === 'inspection') bgColor = 'bg-purple-100';
                else if (type === 'installation') bgColor = 'bg-indigo-100';

                return (
                  <div key={type} className={`p-3 rounded-lg ${bgColor}`}>
                    <div className="text-xs text-gray-600 capitalize mb-1">
                      {type}
                    </div>
                    <div className="text-lg font-semibold text-gray-800">{count as number}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
