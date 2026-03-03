// components/opportunities/DuplicateModal.tsx
'use client';

import React from 'react';
import { X, AlertTriangle, Check, ChevronRight, Clock, User, Building, Car } from 'lucide-react';
import { Opportunity } from '@/services/opportunityService';
import { useRouter } from 'next/navigation';

interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnyway: () => void;
  existingOpportunities: Opportunity[];
  newOpportunityData: any;
}

export default function DuplicateModal({
  isOpen,
  onClose,
  onContinueAnyway,
  existingOpportunities,
  newOpportunityData
}: DuplicateModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleViewExisting = (opportunityId: string) => {
    router.push(`/opportunities/${opportunityId}`);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'prospecting': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'New';
      case 'won': return 'Won';
      case 'lost': return 'Lost';
      case 'prospecting': return 'Prospecting';
      case 'attempted_to_contact': return 'Contact Attempted';
      case 'appointment_scheduled': return 'Appointment Scheduled';
      case 'non_progressive': return 'Non Progressive';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Potential Duplicate Found</h2>
                <p className="text-gray-500 text-sm">
                  We found {existingOpportunities.length} existing opportunity with similar details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Check before proceeding</h3>
                <p className="text-red-600 text-sm">
                  This customer already has {existingOpportunities.length} existing opportunity.
                  Consider using the existing opportunity instead of creating a new one.
                </p>
              </div>
            </div>
          </div>

          {/* New Opportunity Summary */}
          <div className="mb-6 p-4 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">New Opportunity Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-gray-500">Customer:</span>
                <p className="font-medium">
                  {newOpportunityData.accountType === 'individual'
                    ? `${newOpportunityData.firstName} ${newOpportunityData.lastName}`
                    : newOpportunityData.companyName}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Contact:</span>
                <p className="font-medium">{newOpportunityData.email || 'No email'}</p>
                <p className="text-sm text-gray-600">{newOpportunityData.phoneCode}{newOpportunityData.phone}</p>
              </div>
            </div>
          </div>

          {/* Existing Opportunities */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Existing Opportunities</h3>
            <div className="space-y-3">
              {existingOpportunities.map((opportunity) => (
                <div
                  key={opportunity._id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
                  onClick={() => handleViewExisting(opportunity._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {opportunity.type === 'individual' ? (
                          <User className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Building className="h-4 w-4 text-gray-500" />
                        )}
                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-600">
                          {opportunity.subject}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}>
                          {getStatusLabel(opportunity.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Customer:</span>
                          <p className="font-medium">{opportunity.customer.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium">{opportunity.customer.email || 'No email'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <p className="font-medium">{formatDate(opportunity.createdAt)}</p>
                        </div>
                      </div>
                      
                      {opportunity.vehicles && opportunity.vehicles.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <Car className="h-3 w-3" />
                          <span>{opportunity.vehicles.length} vehicle(s)</span>
                        </div>
                      )}
                      
                      {opportunity.leadScore && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              opportunity.leadScore.tier === 'hot' ? 'bg-red-100 text-red-800' :
                              opportunity.leadScore.tier === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {opportunity.leadScore.tier} lead ({opportunity.leadScore.totalScore}pts)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Important Note</h4>
                <p className="text-yellow-700 text-sm">
                  Creating duplicate opportunities can lead to confusion, wasted effort, and poor customer experience.
                  It's recommended to work with existing opportunities when possible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Found {existingOpportunities.length} potential duplicate{existingOpportunities.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  existingOpportunities.forEach(opp => {
                  });
                  onContinueAnyway();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium shadow-sm transition-all flex items-center gap-2"
              >
                View Duplicates Details & Continue
              </button>
              
              <button
                onClick={onContinueAnyway}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 font-medium shadow-sm transition-all flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Create Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}