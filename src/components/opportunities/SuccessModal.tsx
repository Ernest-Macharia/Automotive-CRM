'use client';

import { 
  CheckCircle, 
  X, 
  FileText, 
  User, 
  Car, 
  Calendar, 
  Copy, 
  ArrowRight,
  Sparkles,
  Mail,
  Phone,
  Building,
  Users,
  Plus,
  AlertTriangle,
  CreditCard,
  Wrench,
  ShoppingBag
} from 'lucide-react';
import { Opportunity } from '@/services/opportunityService';
import { workOrderService } from '@/services/workOrderService';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onViewDetails?: () => void;
  onCreateAnother?: () => void;
  onAssignToTeam?: () => void;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  opportunity, 
  onViewDetails, 
  onCreateAnother,
  onAssignToTeam 
}: SuccessModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  if (!opportunity) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
            <div className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Opportunity Created</h3>
              <p className="text-gray-500 text-sm mb-4">
                The opportunity was created successfully, but we couldn't retrieve all the details due to a network issue.
                Please refresh the page to see the complete information.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-600';
      case 'attempted_to_contact': return 'bg-purple-100 text-purple-600';
      case 'prospecting': return 'bg-amber-100 text-amber-600';
      case 'appointment_scheduled': return 'bg-orange-100 text-orange-600';
      case 'non_progressive': return 'bg-gray-100 text-gray-600';
      case 'lost': return 'bg-red-100 text-red-600';
      case 'won': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getCustomerName = () => {
    if (opportunity.customer?.name) return opportunity.customer.name;
    return 'Customer';
  };

  const getCustomerInitial = () => {
    const name = getCustomerName();
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getOpportunityTypeDisplay = () => {
    if (!opportunity.opportunityType) return 'General';
    
    switch (opportunity.opportunityType) {
      case 'SERVICE': return 'Service';
      case 'SALE': return 'Sale';
      case 'REPAIR': return 'Repair';
      case 'MAINTENANCE': return 'Maintenance';
      case 'INSPECTION': return 'Inspection';
      default: return opportunity.opportunityType;
    }
  };

  // Check if opportunity is a service type
  const isServiceOpportunity = () => {
    const serviceTypes = ['SERVICE', 'REPAIR', 'MAINTENANCE', 'INSPECTION'];
    return serviceTypes.includes(opportunity.opportunityType || '');
  };

  // Check if opportunity is a sale/product type
  const isSalesOpportunity = () => {
    return opportunity.opportunityType === 'SALE';
  };

  // Get the appropriate action button text and icon
  const getActionButtonInfo = () => {
    if (isServiceOpportunity()) {
      return {
        text: 'Go to Work Order',
        icon: Wrench,
        color: 'from-blue-500 to-blue-600',
        hoverColor: 'from-blue-600 to-blue-700',
        description: 'Create and manage work orders for this service opportunity'
      };
    } else if (isSalesOpportunity()) {
      return {
        text: 'Go to Sales Order',
        icon: ShoppingBag,
        color: 'from-green-500 to-green-600',
        hoverColor: 'from-green-600 to-green-700',
        description: 'Create and manage sales orders for this product opportunity'
      };
    } else {
      return {
        text: 'View Opportunity Details',
        icon: FileText,
        color: 'from-blue-500 to-purple-600',
        hoverColor: 'from-blue-600 to-purple-700',
        description: 'See complete opportunity information'
      };
    }
  };

  const handleActionButtonClick = async () => {
    if (isServiceOpportunity()) {
      try {
        const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunity._id);
        const existingWorkOrder = workOrders[0];

        if (existingWorkOrder?._id) {
          router.push(`/orders/work-orders/${existingWorkOrder._id}`);
          onClose();
          return;
        }

        const createdWorkOrder = await workOrderService.createWorkOrderFromOpportunity(opportunity._id);

        if (createdWorkOrder?._id) {
          router.push(`/orders/work-orders/${createdWorkOrder._id}`);
          onClose();
          return;
        }
      } catch (error) {
        console.error('Error opening work order from success modal:', error);
        router.push('/orders/work-orders');
        onClose();
        return;
      }
    } else if (isSalesOpportunity()) {
      // Navigate to sales order creation/management
      router.push(`/opportunities/${opportunity._id}/sales-order`);
      onClose();
      return;
    } else {
      // Default to view details
      onViewDetails?.();
    }
    onClose();
  };

  const actionButtonInfo = getActionButtonInfo();
  const ActionIcon = actionButtonInfo.icon;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Opportunity Created Successfully!</h2>
                  <p className="text-white/90 text-sm">Your opportunity has been created and is ready for further processing</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {/* Success Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center animate-pulse">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunity Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Opportunity Details Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Opportunity Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Subject</div>
                    <div className="font-medium text-gray-800 text-lg">{opportunity.subject || 'New Opportunity'}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Status</div>
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${getStatusColor(opportunity.status)}`}>
                        <div className="w-2 h-2 rounded-full bg-current opacity-75"></div>
                        {getStatusDisplay(opportunity.status)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Customer Type</div>
                      <div className="flex items-center gap-2">
                        {opportunity.type === 'organization' ? (
                          <>
                            <Building className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">Organization</span>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Individual</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Opportunity Type Display */}
                  {opportunity.opportunityType && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Opportunity Type</div>
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
                        isServiceOpportunity() 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {isServiceOpportunity() ? (
                          <Wrench className="h-4 w-4" />
                        ) : (
                          <ShoppingBag className="h-4 w-4" />
                        )}
                        {getOpportunityTypeDisplay()}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">ID</div>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-mono text-gray-800 flex-1 truncate">
                        {opportunity._id?.substring?.(0, 12) || 'N/A'}...
                      </code>
                      {opportunity._id && (
                        <button 
                          onClick={() => copyToClipboard(opportunity._id)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Copy ID"
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-2xl border border-purple-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Customer Avatar and Name */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {getCustomerInitial()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border-2 border-purple-100">
                        {opportunity.type === 'organization' ? (
                          <Building className="h-3 w-3 text-purple-600" />
                        ) : (
                          <User className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-lg">{getCustomerName()}</h4>
                      {opportunity.customer?.companyName && (
                        <p className="text-sm text-gray-600 mt-1">{opportunity.customer.companyName}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Contact Details */}
                  <div className="space-y-3">
                    {opportunity.customer?.email && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-600">Email</div>
                          <div className="font-medium text-gray-800 truncate">{opportunity.customer.email}</div>
                        </div>
                      </div>
                    )}
                    
                    {opportunity.customer?.phone && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Phone className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Phone</div>
                          <div className="font-medium text-gray-800">{opportunity.customer.phone}</div>
                        </div>
                      </div>
                    )}

                    {opportunity.customer?.secondaryPhone && (
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Phone className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Secondary Number</div>
                          <div className="font-medium text-gray-800">{opportunity.customer.secondaryPhone}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Company Contact Details */}
                    {(opportunity.customer?.companyEmail || opportunity.customer?.companyPhone) && (
                      <div className="p-3 bg-white/50 rounded-lg border border-gray-100">
                        <div className="text-xs font-medium text-gray-600 mb-2">Company Contact</div>
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
            </div>

            {/* Financial Summary */}
            {(opportunity.subtotal !== undefined || opportunity.total !== undefined) && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {opportunity.subtotal !== undefined && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Subtotal</div>
                          <div className="text-xl font-bold text-gray-800">
                            KES {opportunity.subtotal?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {opportunity.totalDiscount !== undefined && (
                    <div className="bg-gradient-to-br from-red-50 to-red-100/30 rounded-xl border border-red-200 p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <CreditCard className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Discount</div>
                          <div className="text-xl font-bold text-red-600">
                            - KES {opportunity.totalDiscount?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {opportunity.total !== undefined && (
                    <div className={`rounded-xl border ${
                      isServiceOpportunity() 
                        ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/30'
                        : 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/30'
                    } p-4`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 ${
                          isServiceOpportunity() 
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-green-100 text-green-600'
                        } rounded-lg`}>
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Grand Total</div>
                          <div className={`text-xl font-bold ${
                            isServiceOpportunity() ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            KES {opportunity.total?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-3">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{opportunity.vehicles?.length || 0}</div>
                  <div className="text-sm text-gray-600">Vehicle{opportunity.vehicles?.length !== 1 ? 's' : ''}</div>
                </div>
                
                <div className="text-center p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/30">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{opportunity.quotes?.length || 0}</div>
                  <div className="text-sm text-gray-600">Quote{opportunity.quotes?.length !== 1 ? 's' : ''}</div>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {formatDate(opportunity.createdAt || new Date().toISOString()).split(',')[0]}
                  </div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
                
                {opportunity.leadScore && (
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/30 border border-red-200">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{opportunity.leadScore.totalScore || 0}</div>
                    <div className="text-sm text-gray-600 capitalize">{opportunity.leadScore.tier || 'unknown'} Lead</div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Next Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={handleActionButtonClick}
                  className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isServiceOpportunity() 
                        ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' 
                        : 'bg-green-100 text-green-600 group-hover:bg-green-200'
                    } transition-colors`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{actionButtonInfo.text}</div>
                      <div className="text-sm text-gray-500">{actionButtonInfo.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    onCreateAnother?.();
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Create Another</div>
                      <div className="text-sm text-gray-500">Add new opportunity</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-green-500 transition-colors" />
                  </div>
                </button>
                
                {onAssignToTeam && (
                  <button
                    onClick={() => {
                      onAssignToTeam();
                      onClose();
                    }}
                    className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">Assign to Team</div>
                        <div className="text-sm text-gray-500">Assign this opportunity</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-purple-500 transition-colors" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Created at {formatDate(opportunity.createdAt || new Date().toISOString())}
                {opportunity.opportunityType && ` • Type: ${getOpportunityTypeDisplay()}`}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Close
                </button>
                
                <button
                  onClick={handleActionButtonClick}
                  className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${actionButtonInfo.color} text-white hover:${actionButtonInfo.hoverColor} text-sm font-medium shadow-sm transition-all flex items-center gap-2`}
                >
                  {actionButtonInfo.text}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
