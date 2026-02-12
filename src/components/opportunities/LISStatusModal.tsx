'use client';

import { X, CheckCircle2, AlertCircle, XCircle, RefreshCw, Info } from 'lucide-react';

interface LISStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  lisStatus?: {
    canProgress: boolean;
    status: 'green' | 'amber' | 'red';
    missingFields?: string[];
    lastChecked?: string;
  };
  opportunityId: string;
  onRefresh: () => Promise<void>;
}

export default function LISStatusModal({
  isOpen,
  onClose,
  lisStatus,
  opportunityId,
  onRefresh
}: LISStatusModalProps) {
  if (!isOpen) return null;

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'green':
        return {
          label: 'Ready to Progress',
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: CheckCircle2,
          description: 'All required fields are complete. This opportunity can progress to the next stage.'
        };
      case 'amber':
        return {
          label: 'Needs Review',
          color: 'text-amber-600',
          bg: 'bg-amber-100',
          icon: AlertCircle,
          description: 'Some fields are missing. Review and complete the required information.'
        };
      case 'red':
        return {
          label: 'Cannot Progress',
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: XCircle,
          description: 'Critical fields are missing. This opportunity cannot progress until completed.'
        };
      default:
        return {
          label: 'Not Checked',
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          icon: Info,
          description: 'LIS validation has not been performed for this opportunity.'
        };
    }
  };

  const config = getStatusConfig(lisStatus?.status);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">LIS Status Details</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Status Badge */}
              <div className={`flex items-center gap-3 p-4 ${config.bg} rounded-lg mb-6`}>
                <config.icon className={`h-6 w-6 ${config.color}`} />
                <div>
                  <p className={`font-semibold ${config.color}`}>{config.label}</p>
                  <p className="text-sm text-gray-700 mt-1">{config.description}</p>
                </div>
              </div>

              {/* Missing Fields */}
              {lisStatus?.missingFields && lisStatus.missingFields.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Missing Required Fields</h3>
                  <div className="space-y-2">
                    {lisStatus.missingFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{field}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Checked */}
              {lisStatus?.lastChecked && (
                <div className="text-sm text-gray-600 mb-6">
                  Last checked: {new Date(lisStatus.lastChecked).toLocaleString()}
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={async () => {
                  await onRefresh();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh LIS Validation
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}