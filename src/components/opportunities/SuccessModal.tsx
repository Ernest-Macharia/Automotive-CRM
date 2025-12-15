'use client';

import { 
  CheckCircle, 
  X, 
  FileText, 
  User, 
  Car, 
  Calendar, 
  Copy, 
  Share2, 
  ArrowRight,
  Sparkles,
  Mail,
  Phone,
  Building,
  Users,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Opportunity } from '@/services/opportunityService';

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
        weekday: 'long',
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
    if (!status) return 'bg-gray-100 text-gray-600 border border-gray-200';
    
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-600 border border-blue-200';
      case 'attempted_to_contact': return 'bg-purple-100 text-purple-600 border border-purple-200';
      case 'prospecting': return 'bg-amber-100 text-amber-600 border border-amber-200';
      case 'appointment_scheduled': return 'bg-orange-100 text-orange-600 border border-orange-200';
      case 'non_progressive': return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'lost': return 'bg-red-100 text-red-600 border border-red-200';
      case 'won': return 'bg-green-100 text-green-600 border border-green-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return '📋';
    
    switch (status) {
      case 'new': return '🆕';
      case 'attempted_to_contact': return '📞';
      case 'prospecting': return '🔍';
      case 'appointment_scheduled': return '📅';
      case 'non_progressive': return '⏸️';
      case 'lost': return '📉';
      case 'won': return '🏆';
      default: return '📋';
    }
  };

  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareOpportunity = () => {
    if (navigator.share) {
      navigator.share({
        title: `Opportunity: ${opportunity.subject || 'New Opportunity'}`,
        text: `Check out this new opportunity: ${opportunity.subject || 'New Opportunity'}`,
        url: window.location.href,
      });
    }
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

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Opportunity Created Successfully!</h2>
                  <p className="text-emerald-100 text-sm">All details have been saved and processed</p>
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
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {/* Success Animation/Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center animate-pulse">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunity Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Opportunity Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ID</span>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {opportunity._id?.substring?.(0, 8) || 'N/A'}...
                          </code>
                          {opportunity._id && (
                            <button 
                              onClick={() => copyToClipboard(opportunity._id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy ID"
                            >
                              <Copy className="h-4 w-4 text-gray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Subject</span>
                        <span className="font-medium text-gray-800">{opportunity.subject || 'New Opportunity'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(opportunity.status)}`}>
                          {getStatusIcon(opportunity.status)} {getStatusDisplay(opportunity.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Type</span>
                        <span className="flex items-center gap-2">
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
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {getCustomerInitial()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{getCustomerName()}</h4>
                        {opportunity.customer?.companyName && (
                          <p className="text-sm text-gray-600">{opportunity.customer.companyName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 pl-1">
                      {opportunity.customer?.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{opportunity.customer.email}</span>
                        </div>
                      )}
                      
                      {opportunity.customer?.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{opportunity.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gray-50">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-2">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{opportunity.vehicles?.length || 0}</div>
                    <div className="text-sm text-gray-600">Vehicle{opportunity.vehicles?.length !== 1 ? 's' : ''}</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl bg-gray-50">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-100 to-green-200 flex items-center justify-center mx-auto mb-2">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{opportunity.quotes?.length || 0}</div>
                    <div className="text-sm text-gray-600">Quote{opportunity.quotes?.length !== 1 ? 's' : ''}</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl bg-gray-50">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {formatDate(opportunity.createdAt || new Date().toISOString()).split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-600">Created Date</div>
                  </div>
                  
                  {opportunity.leadScore && (
                    <div className="text-center p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-100 to-orange-200 flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{opportunity.leadScore.totalScore || 0}</div>
                      <div className="text-sm text-gray-600 capitalize">{opportunity.leadScore.tier || 'unknown'} Lead</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Next Steps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onViewDetails?.();
                      onClose();
                    }}
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-800">View Full Details</div>
                        <div className="text-sm text-gray-500">See complete opportunity information</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-blue-500" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      onCreateAnother?.();
                      onClose();
                    }}
                    className="p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-800">Create Another</div>
                        <div className="text-sm text-gray-500">Add new opportunity</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-green-500" />
                    </div>
                  </button>
                  
                  {onAssignToTeam && (
                    <button
                      onClick={() => {
                        onAssignToTeam();
                        onClose();
                      }}
                      className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-800">Assign to Team</div>
                          <div className="text-sm text-gray-500">Assign this opportunity</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-purple-500" />
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={shareOpportunity}
                    className="p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
                        <Share2 className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-800">Share</div>
                        <div className="text-sm text-gray-500">Share with team members</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-amber-500" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Opportunity created at {formatDate(opportunity.createdAt || new Date().toISOString())}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Close
                </button>
                
                <button
                  onClick={() => {
                    onViewDetails?.();
                    onClose();
                  }}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                >
                  View Opportunity
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