'use client';

import { X, History, User, Clock, Zap } from 'lucide-react';

interface StageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  opportunityId: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-600' },
  attempted_to_contact: { label: 'Attempted to Contact', color: 'bg-purple-100 text-purple-600' },
  prospecting: { label: 'Prospecting', color: 'bg-amber-100 text-amber-600' },
  appointment_scheduled: { label: 'Appointment Scheduled', color: 'bg-orange-100 text-orange-600' },
  non_progressive: { label: 'Non Progressive', color: 'bg-gray-100 text-gray-600' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-600' },
  won: { label: 'Won', color: 'bg-green-100 text-green-600' }
};

export default function StageHistoryModal({
  isOpen,
  onClose,
  stageHistory,
  opportunityId
}: StageHistoryModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusLabel = (status: string) => {
    return statusConfig[status]?.label || status;
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status]?.color || 'bg-gray-100 text-gray-600';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <History className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Stage History</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete timeline of status changes
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {!stageHistory || stageHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No stage history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stageHistory.map((history, index) => (
                    <div key={index} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                      <div className="absolute -left-2 top-0">
                        <div className={`w-4 h-4 rounded-full border-2 border-white ${
                          statusConfig[history.stage]?.color.split(' ')[0] || 'bg-gray-500'
                        }`} />
                      </div>
                      
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.stage)}`}>
                              {getStatusLabel(history.stage)}
                            </span>
                            {history.metadata?.automated && (
                              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600 inline-flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Automated
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDate(history.date)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <User className="h-3 w-3" />
                          <span>
                            {history.triggeredBy?.name || history.triggeredBy?.email || 'System'}
                          </span>
                        </div>
                        
                        {history.metadata?.fromStage && history.metadata?.toStage && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                            Transition: {getStatusLabel(history.metadata.fromStage)} → {getStatusLabel(history.metadata.toStage)}
                          </div>
                        )}
                        
                        {history.metadata?.reason && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">Reason:</span> {history.metadata.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}