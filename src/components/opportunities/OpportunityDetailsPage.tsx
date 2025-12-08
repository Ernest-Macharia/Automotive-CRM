'use client';

import { opportunityService, Opportunity } from '@/services/opportunityService';
import DeleteConfirmationModal from '@/components/opportunities/DeleteConfirmationModal';
import { useToast } from '@/contexts/ToastContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Building, User, Calendar, 
  Car, FileText, DollarSign, CheckCircle, XCircle, Clock,
  TrendingUp, TrendingDown, Target, Shield, Users, Globe,
  MessageCircle, Edit, Trash2, MoreVertical, ChevronRight,
  Smartphone, PhoneCall, Mail as MailIcon, MessageSquare,
  Award, Star, Hash, Briefcase, Wallet, Receipt, ClipboardList,
  BarChart3, Activity, History, Zap, AlertCircle, ExternalLink,
  Download, Printer, Share2, Copy, Eye, EyeOff, Lock, Unlock,
  PhoneIncoming, PhoneOutgoing, MailCheck, CalendarDays,
  Car as CarIcon, Wrench, Settings, Fuel, Battery, X, Edit2,
  Info, Gauge, Calendar as CalendarIcon, Shield as ShieldIcon,
  Cog, Zap as ZapIcon, Droplets, Radio, Bluetooth, Wind, File,
  Sparkles
} from 'lucide-react';

interface LeadScoreBreakdown {
  behavioral?: Record<string, number>;
  automotive?: Record<string, number>;
  commercial?: Record<string, number>;
}

interface OpportunityWithDetails extends Opportunity {
  invoices?: any[];
  payments?: any[];
  leadScore?: {
    totalScore: number;
    tier: 'hot' | 'warm' | 'cold';
    priority: number;
    lastCalculated: string;
    scoreChange?: number;
  } & LeadScoreBreakdown & {
    autoAssigned?: boolean;
  };
  scoreHistory?: Array<{
    date: string;
    score: number;
    tier: string;
    reason: string;
    triggeredBy?: string;
  }>;
}

interface Vehicle {
  _id: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  active?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; pastel: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-600', pastel: 'bg-blue-50' },
  contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-600', pastel: 'bg-purple-50' },
  qualified: { label: 'Qualified', color: 'bg-amber-100 text-amber-600', pastel: 'bg-amber-50' },
  quotation: { label: 'Quotation', color: 'bg-orange-100 text-orange-600', pastel: 'bg-orange-50' },
  won: { label: 'Won', color: 'bg-green-100 text-green-600', pastel: 'bg-green-50' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-600', pastel: 'bg-red-50' }
};

const tierConfig: Record<string, { label: string; color: string; gradient: string }> = {
  hot: { label: 'Hot', color: 'bg-red-100 text-red-600', gradient: 'from-red-400 to-red-500' },
  warm: { label: 'Warm', color: 'bg-amber-100 text-amber-600', gradient: 'from-amber-400 to-amber-500' },
  cold: { label: 'Cold', color: 'bg-blue-100 text-blue-600', gradient: 'from-blue-400 to-blue-500' }
};

interface OpportunityDetailsPageProps {
  opportunityId: string;
  onBack?: () => void;
}

function VehicleDetailsModal({ 
  vehicle, 
  isOpen, 
  onClose 
}: { 
  vehicle: Vehicle | null; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  if (!isOpen || !vehicle) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getVehicleAge = (year: number) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    return age === 0 ? 'New' : `${age} year${age !== 1 ? 's' : ''} old`;
  };

  const getMakeLogo = (make: string) => {
    const logos: Record<string, string> = {
      'toyota': 'https://cdn.worldvectorlogo.com/logos/toyota-1.svg',
      'honda': 'https://cdn.worldvectorlogo.com/logos/honda-1.svg',
      'ford': 'https://cdn.worldvectorlogo.com/logos/ford-8.svg',
      'bmw': 'https://cdn.worldvectorlogo.com/logos/bmw-emblem-1.svg',
      'mercedes': 'https://cdn.worldvectorlogo.com/logos/mercedes-benz-9.svg',
      'audi': 'https://cdn.worldvectorlogo.com/logos/audi-14.svg',
      'volkswagen': 'https://cdn.worldvectorlogo.com/logos/volkswagen-4.svg',
      'hyundai': 'https://cdn.worldvectorlogo.com/logos/hyundai-2.svg',
      'kia': 'https://cdn.worldvectorlogo.com/logos/kia-motors-1.svg',
      'nissan': 'https://cdn.worldvectorlogo.com/logos/nissan-2.svg',
    };
    
    const lowerMake = make.toLowerCase();
    return logos[lowerMake] || `https://via.placeholder.com/60/3B82F6/FFFFFF?text=${make.charAt(0).toUpperCase()}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/30">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* Content */}
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                {/* Vehicle Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                      <img 
                        src={getMakeLogo(vehicle.make)}
                        alt={vehicle.make}
                        className="h-10 w-10 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/40/3B82F6/FFFFFF?text=${vehicle.make.charAt(0).toUpperCase()}`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h2>
                    <p className="text-gray-600">{vehicle.color}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        vehicle.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {vehicle.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600">
                        {getVehicleAge(vehicle.year)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">VIN</span>
                        <span className="text-sm font-medium text-gray-800 font-mono">
                          {vehicle.vin}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Registration</span>
                        <span className="text-sm font-medium text-gray-800">
                          {vehicle.registrationNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Make</span>
                        <span className="text-sm font-medium text-gray-800">
                          {vehicle.make}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Model</span>
                        <span className="text-sm font-medium text-gray-800">
                          {vehicle.model}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Year</span>
                        <span className="text-sm font-medium text-gray-800">
                          {vehicle.year}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Color</span>
                        <span className="text-sm font-medium text-gray-800">
                          {vehicle.color}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-green-500" />
                      Vehicle Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Vehicle Age</span>
                        <span className="text-sm font-medium text-gray-800">
                          {getVehicleAge(vehicle.year)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Added On</span>
                        <span className="text-sm font-medium text-gray-800">
                          {formatDate(vehicle.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Updated</span>
                        <span className="text-sm font-medium text-gray-800">
                          {formatDate(vehicle.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Vehicle ID</span>
                        <span className="text-sm font-medium text-gray-800 font-mono">
                          {vehicle._id.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OpportunityDetailsPage({ opportunityId, onBack }: OpportunityDetailsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [opportunity, setOpportunity] = useState<OpportunityWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'activities' | 'documents' | 'history'>('overview');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunityDetails();
    }
  }, [opportunityId]);

  const fetchOpportunityDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await opportunityService.getOpportunityById(opportunityId);
      setOpportunity(data as OpportunityWithDetails);
      
    } catch (err: any) {
      console.error('Error fetching opportunity details:', err);
      setError(err.message || 'Failed to fetch opportunity details');
      showToast('Failed to load opportunity details', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!opportunity) return;
    
    try {
      setUpdatingStatus(true);
      await opportunityService.updateOpportunity(opportunity._id, { status: newStatus as any });
      await fetchOpportunityDetails();
      showToast('Status updated successfully', 'success', 2000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      
      // Check if it's a lead validation error
      if (err.message && err.message.includes('Lead record not found')) {
        showToast(
          'Cannot move from "new" stage. Lead record is required. Would you like to create one now?',
          'warning',
          5000
        );
      } else {
        showToast('Failed to update status', 'error', 3000);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!opportunity) return;
    
    try {
      setIsDeleting(true);
      await opportunityService.deleteOpportunity(opportunity._id);
      showToast('Opportunity deleted successfully', 'success', 3000);
      
      if (onBack) {
        onBack();
      } else {
        router.push('/opportunities');
      }
    } catch (err: any) {
      console.error('Error deleting opportunity:', err);
      showToast('Failed to delete opportunity', 'error', 3000);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewVehicleDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 70) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (score >= 50) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-blue-400 to-blue-500';
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status]?.color || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    return statusConfig[status]?.label || status;
  };

  const getTierColor = (tier: string) => {
    return tierConfig[tier]?.color || 'bg-gray-100 text-gray-600';
  };

  const getTierLabel = (tier: string) => {
    return tierConfig[tier]?.label || tier;
  };

  // Helper function to render lead score breakdown safely
  const renderLeadScoreBreakdown = (data: Record<string, number> | undefined, title: string, icon: React.ReactNode) => {
    if (!data) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-gray-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-xs font-medium text-gray-800">
                {typeof value === 'number' ? `${value}%` : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/30 rounded-full animate-pulse"></div>
              <div className="h-6 w-48 bg-white/30 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              {/* Main Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                    <div className="h-6 w-32 bg-gray-200/50 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-4 bg-gray-200/50 rounded w-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                    <div className="h-6 w-24 bg-gray-200/50 rounded mb-4"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-3 bg-gray-200/50 rounded w-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onBack ? onBack() : router.push('/opportunities')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <h1 className="text-xl font-bold text-white">Opportunity Details</h1>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {error ? 'Error Loading Opportunity' : 'Opportunity Not Found'}
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'The opportunity you are looking for does not exist or has been removed.'}
              </p>
              <button
                onClick={() => onBack ? onBack() : router.push('/opportunities')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Back to Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBack ? onBack() : router.push('/opportunities')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{opportunity.subject || 'Unnamed Opportunity'}</h1>
              <p className="text-blue-100 text-sm mt-1">
                ID: {opportunity._id?.slice(-8) || 'N/A'} • Created {formatDate(opportunity.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Selector */}
            <div className="relative">
              <select
                value={opportunity.status || 'new'}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updatingStatus}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 disabled:opacity-50 cursor-pointer min-w-[140px]"
              >
                <option value="new" className="text-gray-900">New</option>
                <option value="contacted" className="text-gray-900">Contacted</option>
                <option value="qualified" className="text-gray-900">Qualified</option>
                <option value="quotation" className="text-gray-900">Quotation</option>
                <option value="won" className="text-gray-900">Won</option>
                <option value="lost" className="text-gray-900">Lost</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-white pointer-events-none" />
            </div>
            
            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2.5 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/20 transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-white" />
              </button>
              
              {showActionsMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 z-50 py-2">
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        router.push(`/opportunities/edit?id=${opportunity._id}`);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50/50 flex items-center gap-3"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                      Edit Opportunity
                    </button>
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        handleDelete();
                      }}
                      disabled={isDeleting}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50/50 flex items-center gap-3 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete Opportunity'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer & Opportunity Info Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-1">Customer Information</h2>
                      <p className="text-sm text-gray-600">Primary contact and opportunity details</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status || 'new')}`}>
                      {getStatusLabel(opportunity.status || 'new')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${opportunity.type === 'organization' ? 'bg-gradient-to-br from-purple-100 to-purple-50' : 'bg-gradient-to-br from-blue-100 to-blue-50'}`}>
                          {opportunity.type === 'organization' ? (
                            <Building className="h-5 w-5 text-purple-600" />
                          ) : (
                            <User className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{opportunity.customer?.name || 'No Name'}</h3>
                          <p className="text-sm text-gray-600">
                            {opportunity.type === 'organization' ? 'Organization' : 'Individual'} Lead
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pl-1">
                        {opportunity.customer?.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{opportunity.customer.phone}</span>
                          </div>
                        )}
                        {opportunity.customer?.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700 truncate">{opportunity.customer.email}</span>
                          </div>
                        )}
                        {opportunity.customer?.companyName && (
                          <div className="flex items-center gap-3">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{opportunity.customer.companyName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Opportunity Details */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Source:</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 capitalize">
                          {opportunity.source ? opportunity.source.replace('_', ' ') : 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Created:</span>
                        </div>
                        <span className="text-sm text-gray-800">{formatDate(opportunity.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Last Updated:</span>
                        </div>
                        <span className="text-sm text-gray-800">{formatDate(opportunity.updatedAt)}</span>
                      </div>
                      
                      {opportunity.assignedTo && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Assigned To:</span>
                          </div>
                          <span className="text-sm font-medium text-blue-600">{opportunity.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="border-t border-gray-100/50 p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
                  <div className="flex items-center gap-3">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={!opportunity.customer?.phone}
                      onClick={() => {
                        if (opportunity.customer?.phone) {
                          window.open(`tel:${opportunity.customer.phone}`, '_blank');
                        }
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      Call Customer
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      Send Message
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={!opportunity.customer?.email}
                      onClick={() => {
                        if (opportunity.customer?.email) {
                          window.open(`mailto:${opportunity.customer.email}`, '_blank');
                        }
                      }}
                    >
                      <MailIcon className="h-4 w-4" />
                      Send Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Lead Score & Analytics Card */}
              {opportunity.leadScore && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-1">Lead Score Analytics</h2>
                      <p className="text-sm text-gray-600">AI-powered lead qualification and scoring</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(opportunity.leadScore.tier)}`}>
                        {getTierLabel(opportunity.leadScore.tier)} Lead
                      </span>
                      {opportunity.leadScore.autoAssigned && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-50 text-green-600">
                          AI-Assigned
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Score Progress */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Lead Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">{opportunity.leadScore.totalScore}</span>
                        <span className="text-sm text-gray-500">/100</span>
                        {opportunity.leadScore.scoreChange && opportunity.leadScore.scoreChange !== 0 && (
                          <span className={`flex items-center gap-1 text-sm font-medium ${opportunity.leadScore.scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {opportunity.leadScore.scoreChange > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {Math.abs(opportunity.leadScore.scoreChange)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-3 w-full bg-gray-200/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getScoreProgressColor(opportunity.leadScore.totalScore)} transition-all duration-1000`}
                        style={{ width: `${Math.min(opportunity.leadScore.totalScore, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Cold</span>
                      <span>Warm</span>
                      <span>Hot</span>
                    </div>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderLeadScoreBreakdown(
                      opportunity.leadScore.behavioral,
                      "Behavioral Score",
                      <Activity className="h-4 w-4 text-blue-500" />
                    )}
                    
                    {renderLeadScoreBreakdown(
                      opportunity.leadScore.automotive,
                      "Automotive Score",
                      <Car className="h-4 w-4 text-green-500" />
                    )}
                    
                    {renderLeadScoreBreakdown(
                      opportunity.leadScore.commercial,
                      "Commercial Score",
                      <Briefcase className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Vehicles Section */}
              {opportunity.vehicles && opportunity.vehicles.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-1">Vehicles</h2>
                      <p className="text-sm text-gray-600">{opportunity.vehicles.length} vehicle(s) associated</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opportunity.vehicles.map((vehicle) => (
                      <div key={vehicle._id} className="border border-gray-200/50 rounded-xl p-4 hover:border-blue-300 transition-colors cursor-pointer group bg-white/50"
                           onClick={() => handleViewVehicleDetails(vehicle)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                              <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </h3>
                              <p className="text-sm text-gray-600">{vehicle.color}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-600 text-xs font-medium rounded">
                            Active
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">VIN</p>
                            <p className="font-medium text-gray-800 font-mono">{vehicle.vin}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Registration</p>
                            <p className="font-medium text-gray-800">{vehicle.registrationNumber}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewVehicleDetails(vehicle);
                                  }}>
                            <Eye className="h-3 w-3" />
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quotes</p>
                        <p className="text-lg font-semibold text-gray-900">{opportunity.quotes?.length || 0}</p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Create
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
                        <Briefcase className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Job Cards</p>
                        <p className="text-lg font-semibold text-gray-900">{opportunity.jobCards?.length || 0}</p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Create
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg">
                        <Receipt className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Invoices</p>
                        <p className="text-lg font-semibold text-gray-900">{opportunity.invoices?.length || 0}</p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      View All
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg">
                        <Wallet className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payments</p>
                        <p className="text-lg font-semibold text-gray-900">{opportunity.payments?.length || 0}</p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      View All
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline & History Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                
                <div className="space-y-4">
                  {opportunity.scoreHistory && opportunity.scoreHistory.slice(0, 3).map((history, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${getTierColor(history.tier)?.split(' ')[0] || 'bg-gray-300'}`.replace('text-', '')} />
                        {index < 2 && <div className="w-px h-6 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Score Updated</p>
                        <p className="text-xs text-gray-600">
                          Changed to {history.score} ({history.tier}) • {formatDate(history.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Opportunity Created</p>
                      <p className="text-xs text-gray-600">{formatDate(opportunity.createdAt)}</p>
                    </div>
                  </div>
                  
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2 border-t border-gray-100">
                    View Full History
                  </button>
                </div>
              </div>

              {/* Related Actions Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">Create Quote</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-blue-400" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Briefcase className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">Create Job Card</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-green-400" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Receipt className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">Generate Invoice</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-purple-400" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                        <Wallet className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">Record Payment</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-amber-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VehicleDetailsModal
        vehicle={selectedVehicle}
        isOpen={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false);
          setSelectedVehicle(null);
        }}
      />
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={opportunity?.subject}
        type="opportunity"
      />
    </div>
  );
}