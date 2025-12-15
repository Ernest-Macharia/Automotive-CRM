'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, Calculator, Building, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { invoiceService } from '@/services/invoiceService';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku?: string;
  taxRate?: number;
  discount?: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  opportunityId?: string;
  quoteId?: string;
}

export default function CreateInvoiceModal({ 
  isOpen, 
  onClose, 
  onCreate,
  opportunityId,
  quoteId 
}: CreateInvoiceModalProps) {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    quoteId: quoteId || '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
    subtotal: 0,
    tax: 0,
    total: 0,
    dueDate: '',
    notes: '',
    terms: '',
    paymentStatus: 'draft' as 'draft' | 'pending',
  });

  const taxRate = 16; // Default VAT rate in Kenya

  useEffect(() => {
    if (isOpen) {
      // Set due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      setFormData(prev => ({ 
        ...prev, 
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const calculateTotals = () => {
    let subtotal = 0;
    
    formData.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = item.discount ? (itemTotal * item.discount / 100) : 0;
      const taxAmount = item.taxRate ? ((itemTotal - discountAmount) * item.taxRate / 100) : 0;
      const itemTotalWithTax = itemTotal - discountAmount + taxAmount;
      subtotal += itemTotalWithTax;
    });

    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate' || field === 'discount') {
      newItems[index] = {
        ...newItems[index],
        [field]: Number(value)
      };
      
      // Recalculate item total
      const itemTotal = newItems[index].quantity * newItems[index].unitPrice;
      const discountAmount = newItems[index].discount ? (itemTotal * newItems[index].discount / 100) : 0;
      const taxAmount = newItems[index].taxRate ? ((itemTotal - discountAmount) * newItems[index].taxRate / 100) : 0;
      newItems[index].total = itemTotal - discountAmount + taxAmount;
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const validateForm = () => {
    if (!formData.opportunityId.trim()) {
      showToast('Opportunity is required', 'error');
      return false;
    }
    
    if (!formData.dueDate) {
      showToast('Due date is required', 'error');
      return false;
    }
    
    for (const item of formData.items) {
      if (!item.description.trim()) {
        showToast('All items must have a description', 'error');
        return false;
      }
      
      if (item.quantity <= 0) {
        showToast('Quantity must be greater than 0', 'error');
        return false;
      }
      
      if (item.unitPrice <= 0) {
        showToast('Unit price must be greater than 0', 'error');
        return false;
      }
    }
    
    if (formData.total <= 0) {
      showToast('Total amount must be greater than 0', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const invoiceData = {
        ...formData,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          sku: item.sku,
          taxRate: item.taxRate,
          discount: item.discount
        })),
        totalAmount: formData.total
      };
      
      onCreate(invoiceData);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      showToast(error.message || 'Failed to create invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        opportunityId: opportunityId || '',
        quoteId: quoteId || '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        tax: 0,
        total: 0,
        dueDate: '',
        notes: '',
        terms: '',
        paymentStatus: 'draft',
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Invoice
                  </h3>
                  <p className="text-sm text-gray-600">
                    Create an invoice for billing and payment tracking
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opportunity ID *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.opportunityId}
                      onChange={(e) => handleInputChange('opportunityId', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter Opportunity ID"
                      disabled={loading || !!opportunityId}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quote ID (Optional)
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.quoteId}
                      onChange={(e) => handleInputChange('quoteId', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter Quote ID"
                      disabled={loading || !!quoteId}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                  {formData.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due in {invoiceService.daysUntilDue(formData.dueDate)} days
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => handleInputChange('paymentStatus', e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Payment</option>
                  </select>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Invoice Items *
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Add items and services to include in this invoice
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-700 font-semibold">{index + 1}</span>
                          </div>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm flex-1"
                            placeholder="Item description"
                            disabled={loading}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                            disabled={loading || formData.items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Unit Price (KES)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount || ''}
                            onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                            placeholder="0"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Item Total
                          </label>
                          <div className="px-3 py-1.5 bg-gray-50 rounded-md text-sm font-medium">
                            {invoiceService.formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-xl font-bold text-gray-900">
                      {invoiceService.formatCurrency(formData.subtotal)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Tax ({taxRate}% VAT)</p>
                    <p className="text-xl font-bold text-gray-900">
                      {invoiceService.formatCurrency(formData.tax)}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm text-purple-600 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {invoiceService.formatCurrency(formData.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Additional notes for this invoice..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Payment terms, late fees, etc..."
                    disabled={loading}
                  />
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
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4" />
                    Create Invoice
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