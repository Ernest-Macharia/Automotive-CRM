// components/opportunities/MergeDuplicatesModal.tsx
'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Check, Merge, RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { opportunityService, Opportunity, MergeDuplicatesRequest } from '@/services/opportunityService';

interface MergeDuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (mergedOpportunity: Opportunity) => void;
  sourceOpportunity: Opportunity;
  duplicateOpportunities: Opportunity[];
}

export default function MergeDuplicatesModal({
  isOpen,
  onClose,
  onMergeComplete,
  sourceOpportunity,
  duplicateOpportunities
}: MergeDuplicatesModalProps) {
  const { showToast } = useToast();
  const [isMerging, setIsMerging] = useState(false);
  const [mergeOptions, setMergeOptions] = useState({
    mergeNotes: true,
    mergeVehicles: true,
    keepSourceStatus: true
  });

  if (!isOpen) return null;

  const handleMerge = async () => {
    setIsMerging(true);
    
    try {
      const mergeRequest: MergeDuplicatesRequest = {
        sourceOpportunityId: sourceOpportunity._id,
        duplicateOpportunityIds: duplicateOpportunities.map(opp => opp._id),
        mergeNotes: mergeOptions.mergeNotes,
        mergeVehicles: mergeOptions.mergeVehicles,
        keepSourceStatus: mergeOptions.keepSourceStatus
      };

      const result = await opportunityService.mergeDuplicates(mergeRequest);
      
      if (result.success) {
        showToast(`Successfully merged ${result.mergedCount} duplicates`, 'success', 3000);
        onMergeComplete(result.mergedOpportunity);
        onClose();
      } else {
        throw new Error('Merge failed');
      }
    } catch (error) {
      console.error('Error merging duplicates:', error);
      showToast('Failed to merge duplicates', 'error', 5000);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Merge className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Merge Duplicate Opportunities</h2>
                <p className="text-gray-500 text-sm">
                  Merge {duplicateOpportunities.length} duplicates into the source opportunity
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isMerging}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-800 mb-1">Important Notice</h3>
                <p className="text-purple-600 text-sm">
                  Merging opportunities is permanent and cannot be undone. 
                  Duplicate opportunities will be archived after merging.
                </p>
              </div>
            </div>
          </div>

          {/* Source Opportunity */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Source Opportunity</h3>
            <div className="p-4 rounded-xl border-2 border-purple-300 bg-purple-50">
              <h4 className="font-semibold text-purple-800">{sourceOpportunity.subject}</h4>
              <p className="text-sm text-gray-600">ID: {sourceOpportunity._id}</p>
              <p className="text-sm text-gray-600">Customer: {sourceOpportunity.customer.name}</p>
              <p className="text-sm text-gray-600">Status: {sourceOpportunity.status}</p>
              <p className="text-sm text-gray-600">
                Created: {new Date(sourceOpportunity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Merge Options */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Merge Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeOptions.mergeNotes}
                  onChange={(e) => setMergeOptions(prev => ({ ...prev, mergeNotes: e.target.checked }))}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-700">Merge Notes</span>
                  <p className="text-sm text-gray-500">Combine notes from all duplicate opportunities</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeOptions.mergeVehicles}
                  onChange={(e) => setMergeOptions(prev => ({ ...prev, mergeVehicles: e.target.checked }))}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-700">Merge Vehicles</span>
                  <p className="text-sm text-gray-500">Add vehicles from duplicates to source opportunity</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeOptions.keepSourceStatus}
                  onChange={(e) => setMergeOptions(prev => ({ ...prev, keepSourceStatus: e.target.checked }))}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-700">Keep Source Status</span>
                  <p className="text-sm text-gray-500">Maintain the status of the source opportunity</p>
                </div>
              </label>
            </div>
          </div>

          {/* Duplicate Opportunities */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">
              Duplicate Opportunities ({duplicateOpportunities.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {duplicateOpportunities.map((opportunity) => (
                <div key={opportunity._id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <h4 className="font-medium text-gray-700">{opportunity.subject}</h4>
                  <p className="text-xs text-gray-500">ID: {opportunity._id}</p>
                  <p className="text-xs text-gray-500">Status: {opportunity.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              disabled={isMerging}
              className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleMerge}
              disabled={isMerging}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isMerging ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="h-4 w-4" />
                  Merge Opportunities
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}