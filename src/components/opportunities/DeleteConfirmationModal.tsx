'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Trash2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  type?: 'opportunity' | 'vehicle' | 'quote' | 'invoice' | 'payment';
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  type = 'opportunity'
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'vehicle':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          buttonColor: 'bg-amber-600 hover:bg-amber-700',
          title: title || 'Delete Vehicle',
          description: description || 'Are you sure you want to delete this vehicle? This action will remove the vehicle from the opportunity.',
          warning: 'This action cannot be undone. All associated service history will be removed.'
        };
      case 'quote':
        return {
          icon: AlertTriangle,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          title: title || 'Delete Quote',
          description: description || 'Are you sure you want to delete this quote?',
          warning: 'This action cannot be undone.'
        };
      case 'invoice':
        return {
          icon: AlertTriangle,
          iconColor: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
          title: title || 'Delete Invoice',
          description: description || 'Are you sure you want to delete this invoice?',
          warning: 'This action cannot be undone.'
        };
      case 'payment':
        return {
          icon: AlertTriangle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          title: title || 'Delete Payment',
          description: description || 'Are you sure you want to delete this payment record?',
          warning: 'This action cannot be undone.'
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          title: title || 'Delete Opportunity',
          description: description || 'Are you sure you want to delete this opportunity?',
          warning: 'This action cannot be undone. All associated vehicles, quotes, job cards, invoices, and payments will be permanently removed.'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* Content */}
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`h-16 w-16 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-8 w-8 ${config.iconColor}`} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {config.title}
                </h2>
                {itemName && (
                  <div className="mb-3 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {itemName}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <p className="text-gray-600 text-center mb-4">
                {config.description}
              </p>
              
              {/* Warning */}
              <div className={`mb-6 p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-1">Warning</p>
                    <p className="text-sm text-amber-700">
                      {config.warning}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                      <p className="text-sm text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-3 ${config.buttonColor} text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete {type.charAt(0).toUpperCase() + type.slice(1)}
                    </>
                  )}
                </button>
              </div>
              
              {/* Additional Warning for Opportunities */}
              {type === 'opportunity' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Note:</span> This will also delete all associated records including vehicles, quotes, and service history. Consider archiving instead if you want to keep historical data.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}