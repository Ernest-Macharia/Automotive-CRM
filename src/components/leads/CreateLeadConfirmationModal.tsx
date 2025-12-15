'use client';

import { X, AlertCircle, User, Mail, Phone, Building, Target, MessageSquare } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: any;
  loading?: boolean;
}

export default function CreateLeadConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  loading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getSourceLabel = (source: string) => {
    const sources: Record<string, string> = {
      website: 'Website',
      referral: 'Referral',
      social_media: 'Social Media',
      email: 'Email Campaign',
      event: 'Event/Trade Show',
      advertisement: 'Advertisement',
      cold_call: 'Cold Call',
      other: 'Other'
    };
    return sources[source] || source;
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      new: 'New',
      attempted_to_contact: 'Attempted to Contact',
      prospecting: 'Prospecting',
      appointment_scheduled: 'Appointment Scheduled',
      non_progressive: 'Non Progressive',
      lost: 'Lost',
      won: 'Won'
    };
    return statuses[status] || status;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl transform transition-all">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Confirm Lead Creation</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Please review the lead details before creating
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formData.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {formData.email || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {formData.phone || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Company
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {formData.company || formData.companyName || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Lead Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Type</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formData.type === 'organization' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {formData.type === 'organization' ? 'Organization' : 'Individual'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Source</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getSourceLabel(formData.source)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formData.status === 'new' 
                        ? 'bg-blue-100 text-blue-800' 
                        : formData.status === 'lost'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {getStatusLabel(formData.status)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Stage</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formData.stage ? getStatusLabel(formData.stage) : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(formData.purposeOfEnquiry || formData.budgetRange || formData.notes) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    Additional Information
                  </h3>
                  <div className="space-y-3">
                    {formData.purposeOfEnquiry && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Purpose of Enquiry</p>
                        <p className="text-sm text-gray-800">{formData.purposeOfEnquiry}</p>
                      </div>
                    )}
                    {formData.budgetRange && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Budget Range</p>
                        <p className="text-sm text-gray-800">{formData.budgetRange}</p>
                      </div>
                    )}
                    {formData.notes && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning for missing required fields */}
              {(!formData.email || !formData.phone) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Missing Required Information</p>
                      <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                        {!formData.email && <li>Email address is required</li>}
                        {!formData.phone && <li>Phone number is required</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || !formData.email || !formData.phone}
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Lead...
                  </>
                ) : (
                  'Confirm & Create Lead'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}