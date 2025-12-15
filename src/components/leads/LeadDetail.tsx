'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, Building, Target, 
  Calendar, MapPin, Briefcase, MessageSquare, Edit, 
  Trash2, Sparkles, Tag, Clock, Activity,
  Loader2, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { leadService, Lead } from '@/services/leadService';
import { useToast } from '@/contexts/ToastContext';
import DeleteModal from '@/components/leads/DeleteModal';

interface LeadDetailProps {
  leadId: string;
  onBack: () => void;
}

export default function LeadDetail({ leadId, onBack }: LeadDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const data = await leadService.getLeadById(leadId);
      setLead(data);
    } catch (error) {
      console.error('Failed to fetch lead:', error);
      showToast('Failed to load lead details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await leadService.deleteLead(leadId);
      showToast('Lead deleted successfully', 'success');
      setShowDeleteModal(false);
      router.push('/leads');
    } catch (error) {
      console.error('Failed to delete lead:', error);
      showToast('Failed to delete lead', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

    const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'new': return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'attempted_to_contact': return 'bg-purple-100 text-purple-800 border border-purple-200';
        case 'prospecting': return 'bg-amber-100 text-amber-800 border border-amber-200';
        case 'appointment_scheduled': return 'bg-orange-100 text-orange-800 border border-orange-200';
        case 'non_progressive': return 'bg-gray-100 text-gray-800 border border-gray-200';
        case 'lost': return 'bg-red-100 text-red-800 border border-red-200';
        case 'won': return 'bg-green-100 text-green-800 border border-green-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lead not found</h3>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Gradient Header */}
      <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Lead ID: {lead._id.substring(0, 8)}...
                    {lead.companyName && ` • ${lead.companyName}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </button>
              <button
                onClick={() => router.push(`/leads/edit?id=${leadId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-all"
              >
                <Edit className="h-4 w-4" />
                Edit Lead
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lead Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 via-blue-100/30 to-purple-50/20">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Contact Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800 font-medium">{lead.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-800 font-medium">{lead.phone}</p>
                    </div>
                  </div>
                  
                  {lead.companyName && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Company</p>
                        <p className="text-gray-800 font-medium">{lead.companyName}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.address && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-800 font-medium">{lead.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Card */}
            {lead.notes && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 via-purple-100/30 to-blue-50/20">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    Notes
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Lead Details */}
          <div className="space-y-8">
            {/* Status Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 via-purple-100/30 to-blue-50/20">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Lead Status
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Source</p>
                    <p className="text-gray-800 font-medium capitalize">{lead.source?.replace('_', ' ')}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Stage</p>
                    <p className="text-gray-800 font-medium">{lead.stage}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="text-gray-800 font-medium capitalize">{lead.type}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 via-blue-100/30 to-purple-50/20">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Timeline
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-gray-800 font-medium">{formatDate(lead.createdAt)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-gray-800 font-medium">{formatDate(lead.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 via-purple-100/30 to-blue-50/20">
                <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/leads/edit?id=${leadId}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Lead
                  </button>
                  
                  <button
                    onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </button>
                  
                  <button
                    onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description="Are you sure you want to delete this lead?"
        itemName={lead.name}
        loading={deleting}
      />
    </div>
  );
}