// components/services/ServiceDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Settings, ArrowLeft, Edit, RefreshCw, Tag,
  Trash2, Loader2, Link,
  AlertTriangle, CheckCircle, XCircle, Wrench,
  Shield, Zap, Search, Copy, Eye, EyeOff
} from 'lucide-react';
import { serviceService, Service, createServiceStatusChecker } from '@/services/serviceService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface ServiceDetailProps {
  serviceId: string;
}

export default function ServiceDetail({ serviceId }: ServiceDetailProps) {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getServiceById(serviceId);
      setService(data);
    } catch (error) {
      console.error('Error fetching service:', error);
      showToast('Failed to load service details', 'error');
      router.push('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!service) return;
    
    try {
      setUpdating(true);
      const updatedService = await serviceService.toggleServiceStatus(serviceId);
      setService(updatedService);
      showToast(`Service ${updatedService.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      console.error('Error toggling service status:', error);
      showToast('Failed to update service status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    
    if (!confirm(`Are you sure you want to delete "${service.name}"? This will mark it as inactive.`)) {
      return;
    }
    
    try {
      setUpdating(true);
      await serviceService.deleteService(serviceId);
      showToast('Service deleted successfully', 'success');
      router.push('/services');
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Failed to delete service', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyCode = () => {
    if (service?.serviceCode) {
      navigator.clipboard.writeText(service.serviceCode);
      showToast('Service code copied to clipboard', 'success');
    }
  };

  const getStatusIcon = () => {
    if (!service) return null;
    const checker = createServiceStatusChecker(service);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {checker.getStatusIcon()} {checker.getStatusText()}
      </span>
    );
  };

  const getTypeIcon = () => {
    if (!service) return null;
    switch (service.type) {
      case 'repair': return <Wrench className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      case 'inspection': return <Search className="h-4 w-4" />;
      case 'installation': return <Shield className="h-4 w-4" />;
      case 'custom': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) return null;

  const statusChecker = createServiceStatusChecker(service);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/services')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-white">{service.name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-blue-100 text-sm">{service.serviceCode}</p>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-white/20 rounded text-white"
                  title="Copy service code"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchService}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-white" />
            </button>

            <Link
              href={`/services/${service._id}/edit`}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <Edit className="h-5 w-5 text-white" />
            </Link>
            
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                service.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {updating ? '...' : service.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Service Overview</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon()}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      statusChecker.getTypeColor()
                    }`}>
                      {getTypeIcon()} {statusChecker.getTypeText()}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  v{service.version}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
                  </div>
                </div>

                {/* Tags */}
                {service.tags && service.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {service.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Internal Notes */}
                {service.internalNotes && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Internal Notes</p>
                      <button
                        onClick={() => setShowInternalNotes(!showInternalNotes)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {showInternalNotes ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Show
                          </>
                        )}
                      </button>
                    </div>
                    {showInternalNotes && (
                      <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{service.internalNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Service Notes */}
                {service.serviceNotes && service.serviceNotes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Service Notes</p>
                    <div className="space-y-2">
                      {service.serviceNotes.map((note, index) => (
                        <div
                          key={index}
                          className="p-2 bg-blue-50 rounded border border-blue-100 text-sm"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => router.push(`/services/${service._id}/edit`)}
                  className="px-3 py-2 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  <Edit className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                
                <button
                  onClick={handleToggleStatus}
                  disabled={updating}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    service.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {service.isActive ? (
                    <>
                      <XCircle className="h-4 w-4 inline mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Activate
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(service.serviceCode);
                    showToast('Service code copied', 'success');
                  }}
                  className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <Copy className="h-4 w-4 inline mr-1" />
                  Copy Code
                </button>
                
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Service Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Service Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Service Code</p>
                  <p className="font-medium">{service.serviceCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <div className="flex items-center gap-1">
                    {getTypeIcon()}
                    <span className="font-medium">{statusChecker.getTypeText()}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="flex items-center gap-1">
                    {statusChecker.getStatusIcon()}
                    <span className="font-medium">{statusChecker.getStatusText()}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Version</p>
                  <p className="font-medium">v{service.version}</p>
                </div>
              </div>
            </div>

            {/* Created By */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Created By</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {service.createdBy.name?.charAt(0) || service.createdBy.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{service.createdBy.name || 'Unknown User'}</div>
                  <div className="text-sm text-gray-600">{service.createdBy.email || ''}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Timeline</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{formatDate(service.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{formatDate(service.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Usage Stats (Placeholder) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Usage Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tags Count:</span>
                  <span className="font-medium">{service.tags.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Notes Count:</span>
                  <span className="font-medium">{service.serviceNotes?.length || 0}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // Navigate to usage analytics (to be implemented)
                      showToast('Usage analytics coming soon', 'info');
                    }}
                    className="w-full text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Usage Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}