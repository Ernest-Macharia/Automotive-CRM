'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'success' | 'danger';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeColors = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50',
          icon: 'text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
          border: 'border-amber-200'
        };
      case 'danger':
        return {
          bg: 'bg-red-50',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          icon: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700 text-white',
          border: 'border-green-200'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-200'
        };
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'warning':
      case 'danger':
        return <AlertCircle className="h-6 w-6" />;
      case 'success':
        return <CheckCircle className="h-6 w-6" />;
      case 'info':
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  const colors = getTypeColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative ${colors.bg} rounded-2xl shadow-xl w-full max-w-md border ${colors.border}`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.icon} ${colors.bg.replace('50', '100')}`}>
                  {getTypeIcon()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{message}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/50 bg-white/50 rounded-b-2xl">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors.button} text-sm font-medium transition-all disabled:opacity-50`}
              >
                {isLoading ? 'Processing...' : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
