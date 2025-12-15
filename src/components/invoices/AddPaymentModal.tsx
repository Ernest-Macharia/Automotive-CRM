'use client';

import { useState } from 'react';
import { X, CreditCard, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Invoice } from '@/services/invoiceService';
import { invoiceService } from '@/services/invoiceService';

interface AddPaymentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (invoiceId: string, data: any) => void;
}

export default function AddPaymentModal({
  invoice,
  isOpen,
  onClose,
  onAddPayment
}: AddPaymentModalProps) {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: invoice.balance,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer' as 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque',
    reference: '',
    notes: '',
  });

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Cheque' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (formData.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return false;
    }
    
    if (formData.amount > invoice.balance) {
      showToast('Amount cannot exceed invoice balance', 'error');
      return false;
    }
    
    if (!formData.paymentDate) {
      showToast('Payment date is required', 'error');
      return false;
    }
    
    if (!formData.paymentMethod) {
      showToast('Payment method is required', 'error');
      return false;
    }
    
    if (!formData.reference.trim()) {
      showToast('Reference number is required', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const paymentData = {
        ...formData,
        paymentDate: new Date(formData.paymentDate).toISOString()
      };
      
      onAddPayment(invoice.id, paymentData);
    } catch (error: any) {
      console.error('Error adding payment:', error);
      showToast(error.message || 'Failed to add payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        amount: invoice.balance,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        reference: '',
        notes: '',
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Payment
                  </h3>
                  <p className="text-sm text-gray-600">
                    Invoice: {invoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Invoice Total:</span>
                <span className="font-medium text-gray-900">
                  {invoiceService.formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paid Amount:</span>
                <span className="font-medium text-green-600">
                  {invoiceService.formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Balance Due:</span>
                <span className="font-bold text-red-600">
                  {invoiceService.formatCurrency(invoice.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (KES)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0.01"
                    max={invoice.balance}
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter amount"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {invoiceService.formatCurrency(invoice.balance)}
                </p>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Transaction ID / Reference"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional notes about this payment..."
                  disabled={loading}
                />
              </div>

              {/* Payment Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Amount:</span>
                    <span className="font-bold text-green-700">
                      {invoiceService.formatCurrency(formData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Balance:</span>
                    <span className="font-medium text-gray-900">
                      {invoiceService.formatCurrency(invoice.balance - formData.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Add Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}