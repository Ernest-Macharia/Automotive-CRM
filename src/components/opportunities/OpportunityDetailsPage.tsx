'use client';

import { opportunityService, Opportunity } from '@/services/opportunityService';
import DeleteConfirmationModal from '@/components/opportunities/DeleteConfirmationModal';
import ConfirmationModal from '@/components/opportunities/ConfirmationModal';
import NotesSection from '@/components/opportunities/NotesSection';
import ReassignModal from '@/components/opportunities/ReassignModal';
import LISStatusModal from '@/components/opportunities/LISStatusModal';
import SLAStatusModal from '@/components/opportunities/SLAStatusModal';
import StageHistoryModal from '@/components/opportunities/StageHistoryModal';
import { useToast } from '@/contexts/ToastContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOpportunityStatusUpdate } from '@/hooks/useOpportunityStatusUpdate';
import { useOpportunityRefresh, OpportunityStatus } from '@/hooks/useOpportunityRefresh';
import {
  ArrowLeft, Phone, Mail, Building, User, Calendar,
  Car, FileText, CheckCircle, Clock,
  TrendingUp, TrendingDown, Shield, Users,
  MessageCircle, Edit, Trash2, ChevronRight,
  Mail as MailIcon, Hash, Briefcase, Wallet, Receipt,
  Activity, AlertCircle, X, Edit2,
  Info, Gauge, Settings, Fuel, Droplets, Battery, Zap,
  Eye, UserPlus, GitMerge, History, AlertTriangle,
  RefreshCw, BarChart, CheckSquare, Copy, Download,
  Share2, Link, Tag, Percent, DollarSign, Package,
  Wrench, Truck, ClipboardList, CheckCircle2, XCircle
} from 'lucide-react';

interface LeadScoreBreakdown {
  behavioral?: Record<string, number>;
  automotive?: Record<string, number>;
  commercial?: Record<string, number>;
}

interface OpportunityWithDetails extends Opportunity {
  invoices?: any[];
  payments?: any[];
  opportunityType?: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
  servicesProducts?: Array<{
    id?: string;
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
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
  lisStatus?: {
    canProgress: boolean;
    status: 'green' | 'amber' | 'red';
    missingFields?: string[];
    lastChecked?: string;
  };
  slaStatus?: {
    compliant: boolean;
    breaches?: Array<{
      type: string;
      deadline: string;
      breachedAt: string;
    }>;
    deadlines?: Array<{
      type: string;
      dueDate: string;
      status: 'pending' | 'approaching' | 'breached';
    }>;
  };
  stageHistory?: Array<{
    stage: string;
    date: string;
    triggeredBy: {
      _id: string;
      name: string;
      email: string;
    };
    metadata?: {
      fromStage?: string;
      toStage?: string;
      reason?: string;
      automated?: boolean;
    };
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
  lost: { label: 'Lost', color: 'bg-red-100 text-red-600', pastel: 'bg-red-50', activeClass: 'bg-red-500 text-white' },
  won: { label: 'Won', color: 'bg-green-100 text-green-600', pastel: 'bg-green-50', activeClass: 'bg-green-500 text-white' }
};

const tierConfig: Record<string, { label: string; color: string; gradient: string }> = {
  hot: { label: 'Hot', color: 'bg-red-100 text-red-600', gradient: 'from-red-400 to-red-500' },
  warm: { label: 'Warm', color: 'bg-amber-100 text-amber-600', gradient: 'from-amber-400 to-amber-500' },
  cold: { label: 'Cold', color: 'bg-blue-100 text-blue-600', gradient: 'from-blue-400 to-blue-500' }
};

const opportunityTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  SERVICE: { label: 'Service', icon: Wrench, color: 'bg-blue-500' },
  SALE: { label: 'Sale', icon: Truck, color: 'bg-green-500' },
  REPAIR: { label: 'Repair', icon: Settings, color: 'bg-orange-500' },
  MAINTENANCE: { label: 'Maintenance', icon: ClipboardList, color: 'bg-purple-500' },
  INSPECTION: { label: 'Inspection', icon: Eye, color: 'bg-amber-500' }
};

const packageTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  work_order: { label: 'Work Order', icon: FileText, color: 'bg-indigo-500' },
  sales_order: { label: 'Sales Order', icon: Package, color: 'bg-emerald-500' }
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
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
      'tesla': 'https://cdn.worldvectorlogo.com/logos/tesla-motors-1.svg'
    };
    const lowerMake = make.toLowerCase();
    return logos[lowerMake] || `https://via.placeholder.com/60/3B82F6/FFFFFF?text=${make.charAt(0).toUpperCase()}`;
  };

  const getFuelIcon = (fuelType?: string) => {
    if (!fuelType) return <Fuel className="h-4 w-4 text-gray-400" />;
    const fuelIcons: Record<string, React.ReactNode> = {
      'petrol': <Fuel className="h-4 w-4 text-red-500" />,
      'diesel': <Droplets className="h-4 w-4 text-blue-500" />,
      'electric': <Battery className="h-4 w-4 text-green-500" />,
      'hybrid': <Zap className="h-4 w-4 text-purple-500" />
    };
    const lowerFuel = fuelType.toLowerCase();
    return fuelIcons[lowerFuel] || <Fuel className="h-4 w-4 text-gray-400" />;
  };

  const formatMileage = (mileage?: string) => {
    if (!mileage) return 'N/A';
    const num = parseInt(mileage.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return mileage;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M KM`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K KM`;
    return `${num} KM`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center">
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
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {vehicle.color} • {vehicle.bodyType} • {getVehicleAge(vehicle.year)}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Vehicle Information</h3>
                  <div className="space-y-3">
                    {vehicle.vin && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">VIN</span>
                        <span className="text-sm font-medium text-gray-800 font-mono">{vehicle.vin}</span>
                      </div>
                    )}
                    {vehicle.registrationNumber && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Registration</span>
                        <span className="text-sm font-medium text-gray-800">{vehicle.registrationNumber}</span>
                      </div>
                    )}
                    {vehicle.licensePlate && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">License Plate</span>
                        <span className="text-sm font-medium text-gray-800">{vehicle.licensePlate}</span>
                      </div>
                    )}
                    {vehicle.chassisNumber && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Chassis Number</span>
                        <span className="text-sm font-medium text-gray-800">{vehicle.chassisNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Technical Specifications</h3>
                  <div className="space-y-3">
                    {vehicle.engineSize && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Engine Size</span>
                        <span className="text-sm font-medium text-gray-800">{vehicle.engineSize} CC</span>
                      </div>
                    )}
                    {vehicle.fuelType && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Fuel Type</span>
                        <span className="text-sm font-medium text-gray-800">{vehicle.fuelType}</span>
                      </div>
                    )}
                    {vehicle.transmission && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Transmission</span>
                        <span className="text-sm font-medium text-gray-800">{vehicle.transmission}</span>
                      </div>
                    )}
                    {vehicle.mileage && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Mileage</span>
                        <span className="text-sm font-medium text-gray-800">{formatMileage(vehicle.mileage)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {vehicle.images && vehicle.images.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Images</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {vehicle.images.map((image, index) => (
                      <div 
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer border border-gray-200"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img src={image} alt={`Vehicle ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg">
            <X className="h-6 w-6 text-white" />
          </button>
          <img src={selectedImage} alt="Vehicle" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}

export default function OpportunityDetailsPage({ opportunityId, onBack }: OpportunityDetailsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [opportunity, setOpportunity] = useState<OpportunityWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showLISModal, setShowLISModal] = useState(false);
  const [showSLAModal, setShowSLAModal] = useState(false);
  const [showStageHistoryModal, setShowStageHistoryModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecalculatingScore, setIsRecalculatingScore] = useState(false);
  const [isCheckingSLA, setIsCheckingSLA] = useState(false);
  const [isRefreshingLIS, setIsRefreshingLIS] = useState(false);
  const [availableSalesReps, setAvailableSalesReps] = useState<any[]>([]);
  
  const {
    updatingStatus,
    showGenericConfirm,
    genericMessage,
    onGenericConfirm,
    onGenericCancel,
    handleStatusUpdate
  } = useOpportunityStatusUpdate();

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunityDetails();
      fetchAvailableSalesReps();
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

  const fetchAvailableSalesReps = async () => {
    try {
      const reps = await opportunityService.getAvailableSalesReps();
      setAvailableSalesReps(reps);
    } catch (err) {
      console.error('Error fetching sales reps:', err);
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

  const handleReassign = async (userId: string, notes?: string) => {
    if (!opportunity) return;
    try {
      await opportunityService.reassignOpportunity(opportunity._id, userId, notes);
      showToast('Opportunity reassigned successfully', 'success', 3000);
      setShowReassignModal(false);
      await fetchOpportunityDetails();
    } catch (err: any) {
      console.error('Error reassigning opportunity:', err);
      showToast(err.message || 'Failed to reassign opportunity', 'error', 3000);
    }
  };

  const { updateStatus, loading: isUpdating } = useOpportunityRefresh(opportunityId);

  const handleStatusUpdateClick = async (newStatus: OpportunityStatus) => {
    if (!opportunity || opportunity.status === newStatus) return;
    
    const updated = await updateStatus(newStatus);
    if (updated) {
      setOpportunity(updated);
    }
  };

  const handleRecalculateScore = async () => {
    if (!opportunity) return;
    
    try {
      setIsRecalculatingScore(true);
      await opportunityService.recalculateLeadScore(opportunity._id);
      showToast('Lead score recalculated successfully', 'success');
      await fetchOpportunityDetails(); // Refresh data
    } catch (err: any) {
      console.error('Error recalculating score:', err);
      showToast(err.message || 'Failed to recalculate lead score', 'error');
    } finally {
      setIsRecalculatingScore(false);
    }
  };

  const handleRefreshLIS = async () => {
    if (!opportunity) return;
    
    try {
      setIsRefreshingLIS(true);
      await opportunityService.refreshLISValidation(opportunity._id);
      showToast('LIS validation refreshed', 'success');
      await fetchOpportunityDetails(); // Refresh data
    } catch (err: any) {
      console.error('Error refreshing LIS:', err);
      showToast(err.message || 'Failed to refresh LIS validation', 'error');
    } finally {
      setIsRefreshingLIS(false);
    }
  };

  const handleCheckSLA = async () => {
    if (!opportunity) return;
    
    try {
      setIsCheckingSLA(true);
      await opportunityService.checkOpportunitySLA(opportunity._id);
      showToast('SLA status updated', 'success');
      await fetchOpportunityDetails(); // Refresh data
    } catch (err: any) {
      console.error('Error checking SLA:', err);
      showToast(err.message || 'Failed to check SLA status', 'error');
    } finally {
      setIsCheckingSLA(false);
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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-blue-500';
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

  const getLISStatusConfig = (status?: string) => {
    switch (status) {
      case 'green':
        return { label: 'Ready to Progress', color: 'bg-green-100 text-green-600', icon: CheckCircle2 };
      case 'amber':
        return { label: 'Needs Review', color: 'bg-amber-100 text-amber-600', icon: AlertCircle };
      case 'red':
        return { label: 'Cannot Progress', color: 'bg-red-100 text-red-600', icon: XCircle };
      default:
        return { label: 'Not Checked', color: 'bg-gray-100 text-gray-600', icon: Clock };
    }
  };

  const getSLAStatusConfig = (compliant?: boolean) => {
    if (compliant === undefined) return { label: 'Not Checked', color: 'bg-gray-100 text-gray-600', icon: Clock };
    return compliant 
      ? { label: 'Compliant', color: 'bg-green-100 text-green-600', icon: CheckCircle2 }
      : { label: 'Breached', color: 'bg-red-100 text-red-600', icon: AlertTriangle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-6">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-3 w-full bg-gray-200 rounded"></div>
                      <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <button onClick={() => onBack ? onBack() : router.push('/opportunities')} className="mr-4">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Opportunity Details</h1>
        </div>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {error ? 'Error Loading Opportunity' : 'Opportunity Not Found'}
              </h2>
              <p className="text-gray-600 mb-4">{error || 'The opportunity could not be found.'}</p>
              <button
                onClick={() => onBack ? onBack() : router.push('/opportunities')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const LISStatus = getLISStatusConfig(opportunity.lisStatus?.status);
  const SLAStatus = getSLAStatusConfig(opportunity.slaStatus?.compliant);
  const OpportunityTypeIcon = opportunity.opportunityType ? opportunityTypeConfig[opportunity.opportunityType]?.icon : Briefcase;
  const PackageTypeIcon = opportunity.packageType ? packageTypeConfig[opportunity.packageType]?.icon : FileText;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onBack ? onBack() : router.push('/opportunities')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{opportunity.subject}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">ID: {opportunity._id.slice(-8)}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">Created {formatDate(opportunity.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Assigned To Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {opportunity.assignedTo?.name || opportunity.assignedTo?.email || 'Unassigned'}
                </span>
              </div>
              
              <button
                onClick={() => setShowReassignModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">Reassign</span>
              </button>
              
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Edit</span>
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            {Object.entries(statusConfig).map(([status, config]) => {
              const isActive = opportunity.status === status;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusUpdateClick(status as OpportunityStatus)}
                  disabled={updatingStatus || isActive}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? config.activeClass
                      : `bg-gray-100 text-gray-700 hover:bg-gray-200 ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Customer Profile</h2>
                  <p className="text-sm text-gray-600 mt-1">Primary contact and opportunity details</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}>
                    {getStatusLabel(opportunity.status)}
                  </span>
                  {opportunity.opportunityType && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 flex items-center gap-1`}>
                      <OpportunityTypeIcon className="h-3 w-3" />
                      {opportunityTypeConfig[opportunity.opportunityType]?.label}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-xl font-semibold text-white">
                      {opportunity.customer?.name?.charAt(0).toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full border-2 border-gray-100">
                    {opportunity.type === 'organization' ? (
                      <Building className="h-3 w-3 text-gray-600" />
                    ) : (
                      <User className="h-3 w-3 text-gray-600" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {opportunity.customer?.name || 'No Name'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {opportunity.type === 'organization' ? 'Organization' : 'Individual'}
                    {opportunity.customer?.companyName && ` • ${opportunity.customer.companyName}`}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {opportunity.customer?.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Phone className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Phone</div>
                          <div className="text-sm font-medium text-gray-900">{opportunity.customer.phone}</div>
                        </div>
                      </div>
                    )}
                    
                    {opportunity.customer?.email && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Mail className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="text-sm font-medium text-gray-900 truncate">{opportunity.customer.email}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Company Contact Info */}
                  {(opportunity.customer?.companyEmail || opportunity.customer?.companyPhone) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Company Contact</p>
                      <div className="space-y-2">
                        {opportunity.customer?.companyEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-700">{opportunity.customer.companyEmail}</span>
                          </div>
                        )}
                        {opportunity.customer?.companyPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-700">{opportunity.customer.companyPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Score Card */}
            {opportunity.leadScore && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <BarChart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Lead Score Analytics</h2>
                      <p className="text-sm text-gray-600">AI-powered lead qualification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getTierColor(opportunity.leadScore.tier)}`}>
                      {getTierLabel(opportunity.leadScore.tier)} Lead
                    </span>
                    {opportunity.leadScore.autoAssigned && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        AI-Assigned
                      </span>
                    )}
                    <button
                      onClick={handleRecalculateScore}
                      disabled={isRecalculatingScore}
                      className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 text-gray-600 ${isRecalculatingScore ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{opportunity.leadScore.totalScore}</span>
                      <span className="text-sm text-gray-500">/100</span>
                      {opportunity.leadScore.scoreChange !== 0 && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${
                          opportunity.leadScore.scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {opportunity.leadScore.scoreChange > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(opportunity.leadScore.scoreChange)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getScoreProgressColor(opportunity.leadScore.totalScore)} transition-all`}
                      style={{ width: `${Math.min(opportunity.leadScore.totalScore, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Cold</span>
                    <span className="text-xs text-gray-500">Warm</span>
                    <span className="text-xs text-gray-500">Hot</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {opportunity.leadScore.behavioral && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Behavioral</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {Object.values(opportunity.leadScore.behavioral).reduce((a, b) => a + b, 0) / 
                         Object.values(opportunity.leadScore.behavioral).length || 0}%
                      </p>
                    </div>
                  )}
                  {opportunity.leadScore.automotive && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Automotive</p>
                      <p className="text-lg font-semibold text-green-600">
                        {Object.values(opportunity.leadScore.automotive).reduce((a, b) => a + b, 0) / 
                         Object.values(opportunity.leadScore.automotive).length || 0}%
                      </p>
                    </div>
                  )}
                  {opportunity.leadScore.commercial && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Commercial</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {Object.values(opportunity.leadScore.commercial).reduce((a, b) => a + b, 0) / 
                         Object.values(opportunity.leadScore.commercial).length || 0}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services/Products Section */}
            {opportunity.servicesProducts && opportunity.servicesProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      {opportunity.packageType === 'work_order' ? (
                        <Wrench className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Package className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {opportunity.packageType === 'work_order' ? 'Services' : 'Products'}
                      </h2>
                      <p className="text-sm text-gray-600">Items included in this opportunity</p>
                    </div>
                  </div>
                  {opportunity.packageType && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                      packageTypeConfig[opportunity.packageType]?.color.replace('bg-', 'bg-').replace('500', '100') + ' ' +
                      packageTypeConfig[opportunity.packageType]?.color.replace('bg-', 'text-')
                    }`}>
                      <PackageTypeIcon className="h-3 w-3" />
                      {packageTypeConfig[opportunity.packageType]?.label}
                    </span>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {opportunity.servicesProducts.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'SERVICE' ? 'bg-blue-100 text-blue-700' :
                              item.type === 'PRODUCT' ? 'bg-green-100 text-green-700' :
                              item.type === 'PART' ? 'bg-amber-100 text-amber-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-right text-gray-900">{item.discount}%</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700">Subtotal:</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(opportunity.subtotal)}</td>
                      </tr>
                      {opportunity.totalDiscount && opportunity.totalDiscount > 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total Discount:</td>
                          <td className="px-4 py-2 text-right font-medium text-green-600">-{formatCurrency(opportunity.totalDiscount)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-right text-sm font-bold text-gray-900">Total:</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">{formatCurrency(opportunity.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Vehicles Section */}
            {opportunity.vehicles && opportunity.vehicles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Vehicles</h2>
                    <p className="text-sm text-gray-600">{opportunity.vehicles.length} vehicle(s) associated</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunity.vehicles.map((vehicle) => (
                    <div 
                      key={vehicle._id} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => handleViewVehicleDetails(vehicle)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Car className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {vehicle.color} • {vehicle.registrationNumber || 'No plate'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        {vehicle.vin && (
                          <div>
                            <p className="text-xs text-gray-500">VIN</p>
                            <p className="text-xs font-mono text-gray-900 truncate">{vehicle.vin}</p>
                          </div>
                        )}
                        {vehicle.fuelType && (
                          <div>
                            <p className="text-xs text-gray-500">Fuel</p>
                            <p className="text-xs font-medium text-gray-900">{vehicle.fuelType}</p>
                          </div>
                        )}
                      </div>
                      
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage History Section */}
            {opportunity.stageHistory && opportunity.stageHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <History className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Stage History</h2>
                      <p className="text-sm text-gray-600">Recent status changes and transitions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStageHistoryModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {opportunity.stageHistory.slice(0, 3).map((history, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {index < 2 && <div className="w-px h-6 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusConfig[history.stage]?.color || 'bg-gray-100 text-gray-600'
                          }`}>
                            {getStatusLabel(history.stage)}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(history.date)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {history.metadata?.automated ? 'Automatically' : 'Manually'} updated
                          {history.triggeredBy?.name && ` by ${history.triggeredBy.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* LIS Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${LISStatus.color.replace('text-', 'bg-').replace('600', '100')} rounded-lg`}>
                    <LISStatus.icon className={`h-5 w-5 ${LISStatus.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">LIS Status</h3>
                    <p className="text-xs text-gray-600">Lead Information Standard</p>
                  </div>
                </div>
                <button
                  onClick={handleRefreshLIS}
                  disabled={isRefreshingLIS}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshingLIS ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="mb-4">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${LISStatus.color}`}>
                  {LISStatus.label}
                </span>
                {opportunity.lisStatus?.lastChecked && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last checked: {formatDate(opportunity.lisStatus.lastChecked)}
                  </p>
                )}
              </div>
              
              {opportunity.lisStatus?.missingFields && opportunity.lisStatus.missingFields.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Missing Required Fields:</p>
                  <ul className="space-y-1">
                    {opportunity.lisStatus.missingFields.map((field, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => setShowLISModal(true)}
                className="w-full mt-4 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                View Details
              </button>
            </div>

            {/* SLA Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${SLAStatus.color.replace('text-', 'bg-').replace('600', '100')} rounded-lg`}>
                    <SLAStatus.icon className={`h-5 w-5 ${SLAStatus.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">SLA Status</h3>
                    <p className="text-xs text-gray-600">Service Level Agreement</p>
                  </div>
                </div>
                <button
                  onClick={handleCheckSLA}
                  disabled={isCheckingSLA}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 ${isCheckingSLA ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="mb-4">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${SLAStatus.color}`}>
                  {SLAStatus.label}
                </span>
              </div>
              
              {opportunity.slaStatus?.deadlines && opportunity.slaStatus.deadlines.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Upcoming Deadlines:</p>
                  <ul className="space-y-2">
                    {opportunity.slaStatus.deadlines.slice(0, 2).map((deadline, index) => (
                      <li key={index} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{deadline.type}:</span>
                          <span className={`font-medium ${
                            deadline.status === 'breached' ? 'text-red-600' :
                            deadline.status === 'approaching' ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {formatDate(deadline.dueDate)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={() => setShowSLAModal(true)}
                className="w-full mt-4 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                View Details
              </button>
            </div>

            {/* Notes Section */}
            <NotesSection opportunityId={opportunityId} />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Create Quote
                </button>
                
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  Create Job Card
                </button>
                
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Receipt className="h-4 w-4 text-gray-400" />
                  Generate Invoice
                </button>
                
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Copy className="h-4 w-4 text-gray-400" />
                  Duplicate Opportunity
                </button>
                
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Share2 className="h-4 w-4 text-gray-400" />
                  Share Opportunity
                </button>
                
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Download className="h-4 w-4 text-gray-400" />
                  Export Details
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Opportunity Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Source</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {opportunity.source?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {opportunity.type === 'organization' ? 'Organization' : 'Individual'}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(opportunity.createdAt)}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(opportunity.updatedAt)}
                  </span>
                </div>
                
                {opportunity.isNurturing && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Nurturing</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VehicleDetailsModal
        vehicle={selectedVehicle}
        isOpen={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false);
          setSelectedVehicle(null);
        }}
      />

      <ReassignModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        onReassign={handleReassign}
        currentAssignee={opportunity.assignedTo}
        opportunityId={opportunity._id}
      />

      <LISStatusModal
        isOpen={showLISModal}
        onClose={() => setShowLISModal(false)}
        lisStatus={opportunity.lisStatus}
        opportunityId={opportunity._id}
        onRefresh={handleRefreshLIS}
      />

      <SLAStatusModal
        isOpen={showSLAModal}
        onClose={() => setShowSLAModal(false)}
        slaStatus={opportunity.slaStatus}
        opportunityId={opportunity._id}
        onCheck={handleCheckSLA}
      />

      <StageHistoryModal
        isOpen={showStageHistoryModal}
        onClose={() => setShowStageHistoryModal(false)}
        stageHistory={opportunity.stageHistory}
        opportunityId={opportunity._id}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemName={opportunity?.subject}
        type="opportunity"
      />

      <ConfirmationModal
        isOpen={showGenericConfirm}
        onClose={onGenericCancel}
        onConfirm={onGenericConfirm}
        title="Confirm Status Change"
        message={genericMessage}
        confirmText="Confirm"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}