'use client';

import { opportunityService, Opportunity } from '@/services/opportunityService';
import DeleteConfirmationModal from '@/components/opportunities/DeleteConfirmationModal';
import ConfirmationModal from '@/components/opportunities/ConfirmationModal';
import { leadService } from '@/services/leadService'; 
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
  opportunityType?: 'SERVICE' | 'PRODUCT';
  servicesProducts?: Array<{
    id?: string;
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT';
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    total: number;
  }>;
  subtotal?: number;
  totalDiscount?: number;
  total?: number;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyEmail?: string;
  
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
  // Add the new fields as optional
  engineSize?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: string;
  chassisNumber?: string;
  bodyType?: string;
  licensePlate?: string;
}

const statusConfig: Record<string, { label: string; color: string; pastel: string; activeClass: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-600', pastel: 'bg-blue-50', activeClass: 'bg-blue-500 text-white' },
  attempted_to_contact: { label: 'Attempted to Contact', color: 'bg-purple-100 text-purple-600', pastel: 'bg-purple-50', activeClass: 'bg-purple-500 text-white' },
  prospecting: { label: 'Prospecting', color: 'bg-amber-100 text-amber-600', pastel: 'bg-amber-50', activeClass: 'bg-amber-500 text-white' },
  appointment_scheduled: { label: 'Appointment Scheduled', color: 'bg-orange-100 text-orange-600', pastel: 'bg-orange-50', activeClass: 'bg-orange-500 text-white' },
  non_progressive: { label: 'Non Progressive', color: 'bg-gray-100 text-gray-600', pastel: 'bg-gray-50', activeClass: 'bg-gray-500 text-white' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-600', pastel: 'bg-red-50', activeClass: 'bg-red-500 text-white' }
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

  const getVehicleAge = (year: string | number) => {
    if (!year) return 'Unknown';
    const currentYear = new Date().getFullYear();
    const vehicleYear = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(vehicleYear)) return 'Invalid year';
    
    const age = currentYear - vehicleYear;
    return age === 0 ? 'New' : `${age} year${age !== 1 ? 's' : ''} old`;
  };

  const getMakeLogo = (make: string) => {
    if (!make) return `https://via.placeholder.com/60/3B82F6/FFFFFF?text=V`;
    
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
      'mazda': 'https://cdn.worldvectorlogo.com/logos/mazda-6.svg',
      'subaru': 'https://cdn.worldvectorlogo.com/logos/subaru-1.svg',
      'mitsubishi': 'https://cdn.worldvectorlogo.com/logos/mitsubishi-4.svg',
      'chevrolet': 'https://cdn.worldvectorlogo.com/logos/chevrolet-9.svg',
      'lexus': 'https://cdn.worldvectorlogo.com/logos/lexus-2.svg',
      'jeep': 'https://cdn.worldvectorlogo.com/logos/jeep-3.svg',
      'land rover': 'https://cdn.worldvectorlogo.com/logos/land-rover-1.svg',
      'porsche': 'https://cdn.worldvectorlogo.com/logos/porsche-1.svg',
      'volvo': 'https://cdn.worldvectorlogo.com/logos/volvo-2.svg',
      'tesla': 'https://cdn.worldvectorlogo.com/logos/tesla-motors-1.svg',
      'suzuki': 'https://cdn.worldvectorlogo.com/logos/suzuki-1.svg',
      'isuzu': 'https://cdn.worldvectorlogo.com/logos/isuzu-1.svg',
      'peugeot': 'https://cdn.worldvectorlogo.com/logos/peugeot-1.svg',
      'renault': 'https://cdn.worldvectorlogo.com/logos/renault-3.svg',
    };
    
    const lowerMake = make.toLowerCase();
    return logos[lowerMake] || `https://via.placeholder.com/60/3B82F6/FFFFFF?text=${make.charAt(0).toUpperCase()}`;
  };

  const hasTechnicalDetails = () => {
    return vehicle.engineSize || vehicle.fuelType || vehicle.transmission || vehicle.bodyType;
  };

  const hasIdentification = () => {
    return vehicle.vin || vehicle.registrationNumber || vehicle.chassisNumber || vehicle.licensePlate;
  };

  const hasMileageInfo = () => {
    return vehicle.mileage;
  };

  // Calculate data completeness percentage
  const calculateCompleteness = () => {
    const fields = [
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.color,
      vehicle.vin,
      vehicle.registrationNumber,
      vehicle.engineSize,
      vehicle.fuelType,
      vehicle.transmission,
      vehicle.mileage,
      vehicle.chassisNumber,
      vehicle.bodyType,
      vehicle.licensePlate
    ];
    
    const filledFields = fields.filter(field => {
      if (field === null || field === undefined) {
        return false;
      }
      
      // Handle different types
      if (typeof field === 'string') {
        return field.trim() !== '';
      }
      
      if (typeof field === 'number') {
        return field !== 0; // Or use field > 0 if 0 is a valid value
      }
      
      // For any other type, convert to string
      return String(field).trim() !== '';
    }).length;
    
    return Math.round((filledFields / fields.length) * 100);
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-600';
    if (percentage >= 50) return 'bg-amber-100 text-amber-600';
    return 'bg-red-100 text-red-600';
  };

  const getCompletenessLabel = (percentage: number) => {
    if (percentage >= 80) return 'Complete';
    if (percentage >= 50) return 'Moderate';
    return 'Basic';
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
                          target.src = `https://via.placeholder.com/40/3B82F6/FFFFFF?text=${vehicle.make?.charAt(0)?.toUpperCase() || 'V'}`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900">
                      {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make || 'Unknown Make'} {vehicle.model || 'Unknown Model'}
                    </h2>
                    <p className="text-gray-600">
                      {vehicle.color ? `${vehicle.color} • ` : ''}
                      {getVehicleAge(vehicle.year)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getCompletenessColor(calculateCompleteness())}`}>
                        {getCompletenessLabel(calculateCompleteness())} ({calculateCompleteness()}%)
                      </span>
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600">
                        {getVehicleAge(vehicle.year)}
                      </span>
                      {vehicle.bodyType && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-50 text-purple-600">
                          {vehicle.bodyType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-500" />
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      {vehicle.make && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Make</span>
                          <span className="text-sm font-medium text-gray-800">
                            {vehicle.make}
                          </span>
                        </div>
                      )}
                      
                      {vehicle.model && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Model</span>
                          <span className="text-sm font-medium text-gray-800">
                            {vehicle.model}
                          </span>
                        </div>
                      )}
                      
                      {vehicle.year && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Year</span>
                          <span className="text-sm font-medium text-gray-800">
                            {vehicle.year}
                          </span>
                        </div>
                      )}
                      
                      {vehicle.color && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Color</span>
                          <span className="text-sm font-medium text-gray-800">
                            {vehicle.color}
                          </span>
                        </div>
                      )}
                      
                      {vehicle.bodyType && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Body Type</span>
                          <span className="text-sm font-medium text-gray-800">
                            {vehicle.bodyType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technical Details (only show if any technical details exist) */}
                  {hasTechnicalDetails() && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-green-500" />
                        Technical Details
                      </h3>
                      <div className="space-y-3">
                        {vehicle.engineSize && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Engine Size</span>
                            <span className="text-sm font-medium text-gray-800">
                              {vehicle.engineSize} CC
                            </span>
                          </div>
                        )}
                        
                        {vehicle.fuelType && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Fuel Type</span>
                            <span className="text-sm font-medium text-gray-800">
                              {vehicle.fuelType}
                            </span>
                          </div>
                        )}
                        
                        {vehicle.transmission && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Transmission</span>
                            <span className="text-sm font-medium text-gray-800">
                              {vehicle.transmission}
                            </span>
                          </div>
                        )}
                        
                        {vehicle.mileage && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Mileage</span>
                            <span className="text-sm font-medium text-gray-800">
                              {vehicle.mileage} KM
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Identification Details (only show if any identification exists) */}
                {hasIdentification() && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-purple-500" />
                      Identification & Registration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicle.vin && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-100">
                          <div className="text-xs font-medium text-gray-600 mb-1">VIN Number</div>
                          <div className="text-sm font-medium text-gray-800 font-mono break-all">
                            {vehicle.vin}
                          </div>
                        </div>
                      )}
                      
                      {vehicle.registrationNumber && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 border border-green-100">
                          <div className="text-xs font-medium text-gray-600 mb-1">Registration Number</div>
                          <div className="text-sm font-medium text-gray-800 font-semibold">
                            {vehicle.registrationNumber}
                          </div>
                        </div>
                      )}
                      
                      {vehicle.chassisNumber && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-100">
                          <div className="text-xs font-medium text-gray-600 mb-1">Chassis Number</div>
                          <div className="text-sm font-medium text-gray-800 font-mono break-all">
                            {vehicle.chassisNumber}
                          </div>
                        </div>
                      )}
                      
                      {vehicle.licensePlate && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-100">
                          <div className="text-xs font-medium text-gray-600 mb-1">License Plate</div>
                          <div className="text-sm font-medium text-gray-800 font-semibold">
                            {vehicle.licensePlate}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Data Completeness Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Information Completeness</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCompletenessColor(calculateCompleteness())}`}>
                          {getCompletenessLabel(calculateCompleteness())}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{calculateCompleteness()}%</span>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${calculateCompleteness() >= 80 ? 'bg-green-500' : calculateCompleteness() >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${calculateCompleteness()}%` }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Basic Info:</span>
                        <span className="font-medium">{vehicle.make && vehicle.model && vehicle.year && vehicle.color ? 'Complete' : 'Partial'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600">Technical:</span>
                        <span className="font-medium">{hasTechnicalDetails() ? 'Available' : 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-gray-600">Identification:</span>
                        <span className="font-medium">{hasIdentification() ? 'Available' : 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-gray-600">Mileage:</span>
                        <span className="font-medium">{vehicle.mileage ? 'Recorded' : 'Not recorded'}</span>
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
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

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
    if (!opportunity || updatingStatus) return;

    if (opportunity.status === 'new' && newStatus === 'attempted_to_contact') {
      try {
        const hasLead = await checkIfLeadExists(opportunity._id);
        
        if (!hasLead) {
          setTargetStatus(newStatus);
          setShowConfirmationModal(true);
          return;
        }
      } catch (error) {
        console.error('Error checking lead:', error);
      }
    }
    
    await updateOpportunityStatus(newStatus);
  };

  const handleConfirmation = () => {
    if (!opportunity) return;
    
    setShowConfirmationModal(false);
    router.push(`/leads/create?opportunityId=${opportunity._id}`);
  };

  const checkIfLeadExists = async (opportunityId: string): Promise<boolean> => {
    try {
      const response = await leadService.getLeadsByOpportunity(opportunityId, 1, 1);
      return response.data && response.data.length > 0;
    } catch (error) {
      console.error('Error checking lead existence:', error);
      return false;
    }
  };

  const updateOpportunityStatus = async (newStatus: string) => {
    if (!opportunity) return;
    
    try {
      setUpdatingStatus(true);
      await opportunityService.updateOpportunity(opportunity._id, { status: newStatus as any });
      await fetchOpportunityDetails();
      showToast('Status updated successfully', 'success', 2000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error', 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateLeadAndMove = async (leadData: any) => {
    if (!opportunity) return;
    
    try {
      // Create lead
      await leadService.createLead({
        ...leadData,
        opportunityId: opportunity._id
      });
      
      // Update opportunity status
      await updateOpportunityStatus(targetStatus);
      setTargetStatus('');
      
      showToast('Lead created and opportunity moved successfully', 'success', 3000);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      showToast(error.message || 'Failed to create lead', 'error', 3000);
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

  const handleEdit = () => {
    if (!opportunity) return;
    router.push(`/opportunities/edit?id=${opportunity._id}`);
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
            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className="p-2.5 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Edit className="h-5 w-5 text-white" />
              <span className="text-white text-sm font-medium">Edit</span>
            </button>
            
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2.5 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5 text-white" />
              <span className="text-white text-sm font-medium">{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Button Bar - Above the main content */}
      <div className="border-b border-gray-200/50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {Object.entries(statusConfig).map(([status, config]) => {
              const isActive = opportunity.status === status;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updatingStatus || isActive}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive 
                      ? config.activeClass
                      : `bg-gray-100 text-gray-700 hover:bg-gray-200 ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`
                  }`}
                >
                  {config.label}
                  {isActive && (
                    <CheckCircle className="inline-block ml-2 h-4 w-4" />
                  )}
                </button>
              );
            })}
            {updatingStatus && (
              <div className="ml-3 text-sm text-gray-500 italic">
                Updating...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-64px-57px)] p-4 md:p-6 overflow-auto"> {/* Adjusted height for status bar */}
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
                              <p className="text-sm text-gray-600">
                                {vehicle.color} • {vehicle.registrationNumber || 'No plate'}
                                {vehicle.mileage && ` • ${vehicle.mileage} KM`}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            vehicle.make && vehicle.model && vehicle.year ? 
                            'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {vehicle.make && vehicle.model && vehicle.year ? 'Complete' : 'Basic'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          {vehicle.vin && (
                            <div>
                              <p className="text-gray-600">VIN</p>
                              <p className="font-medium text-gray-800 font-mono text-xs truncate">
                                {vehicle.vin}
                              </p>
                            </div>
                          )}
                          {vehicle.fuelType && (
                            <div>
                              <p className="text-gray-600">Fuel</p>
                              <p className="font-medium text-gray-800">{vehicle.fuelType}</p>
                            </div>
                          )}
                          {vehicle.engineSize && (
                            <div>
                              <p className="text-gray-600">Engine</p>
                              <p className="font-medium text-gray-800">{vehicle.engineSize} CC</p>
                            </div>
                          )}
                          {vehicle.transmission && (
                            <div>
                              <p className="text-gray-600">Transmission</p>
                              <p className="font-medium text-gray-800">{vehicle.transmission}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              vehicle.make && vehicle.model && vehicle.year && vehicle.color && 
                              (vehicle.vin || vehicle.registrationNumber) ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {vehicle.make && vehicle.model && vehicle.year && vehicle.color}
                            </span>
                          </div>
                          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewVehicleDetails(vehicle);
                                  }}>
                            <Eye className="h-3 w-3" />
                            View Full Details
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
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setTargetStatus('');
        }}
        onConfirm={handleConfirmation}
        title="Create Lead Required"
        message="A lead record is required to move this opportunity to 'Contacted'. Would you like to create a lead now?"
        confirmText="Create Lead"
        type="info"
      />
    </div>
  );
}