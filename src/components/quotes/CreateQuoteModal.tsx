'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Calculator, Building, Car, User, Calendar } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { quoteService } from '@/services/quoteService';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku?: string;
  taxRate?: number;
  discount?: number;
}

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  opportunityId?: string;
  vehicleId?: string;
}

export default function CreateQuoteModal({ 
  isOpen, 
  onClose, 
  onCreate,
  opportunityId,
  vehicleId 
}: CreateQuoteModalProps) {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [formData, setFormData] = useState({
    quoteNumber: '',
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as QuoteItem[],
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
    notes: '',
    terms: '',
    validUntil: '',
    status: 'draft' as 'draft' | 'pending',
  });

  const taxRate = 16; // Default VAT rate in Kenya

  useEffect(() => {
    if (isOpen) {
      generateQuoteNumber();
    }
  }, [isOpen]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const generateQuoteNumber = async () => {
    try {
      setGeneratingNumber(true);
      const number = await quoteService.generateQuoteNumber();
      setFormData(prev => ({ ...prev, quoteNumber: number }));
    } catch (error) {
      console.error('Error generating quote number:', error);
    } finally {
      setGeneratingNumber(false);
    }
  };

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
    const totalAmount = subtotal + tax;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      totalAmount
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
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
    if (!formData.quoteNumber.trim()) {
      showToast('Quote number is required', 'error');
      return false;
    }
    
    if (!formData.opportunityId.trim()) {
      showToast('Opportunity is required', 'error');
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
    
    if (formData.totalAmount <= 0) {
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
      const quoteData = {
        ...formData,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          sku: item.sku,
          taxRate: item.taxRate,
          discount: item.discount
        }))
      };
      
      onCreate(quoteData);
    } catch (error: any) {
      console.error('Error creating quote:', error);
      showToast(error.message || 'Failed to create quote', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        quoteNumber: '',
        opportunityId: opportunityId || '',
        vehicleId: vehicleId || '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        tax: 0,
        totalAmount: 0,
        notes: '',
        terms: '',
        validUntil: '',
        status: 'draft',
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
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Quote
                  </h3>
                  <p className="text-sm text-gray-600">
                    Create a detailed quote for your customer
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
                    Quote Number *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.quoteNumber}
                      onChange={(e) => handleInputChange('quoteNumber', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Q-2024-001"
                      disabled={loading || generatingNumber}
                    />
                  </div>
                  {generatingNumber && (
                    <p className="text-xs text-gray-500 mt-1">Generating quote number...</p>
                  )}
                </div>

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
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Opportunity ID"
                      disabled={loading || !!opportunityId}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle ID
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.vehicleId}
                      onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Vehicle ID"
                      disabled={loading || !!vehicleId}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Quote Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quote Items *
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Add items and services to include in this quote
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
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
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold">{index + 1}</span>
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
                            {quoteService.formatCurrency(item.total)}
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
                      {quoteService.formatCurrency(formData.subtotal)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Tax ({taxRate}% VAT)</p>
                    <p className="text-xl font-bold text-gray-900">
                      {quoteService.formatCurrency(formData.tax)}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {quoteService.formatCurrency(formData.totalAmount)}
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes for this quote..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Payment terms, delivery conditions, etc..."
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="submitAsPending"
                  checked={formData.status === 'pending'}
                  onChange={(e) => handleInputChange('status', e.target.checked ? 'pending' : 'draft')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="submitAsPending" className="text-sm text-gray-700">
                  Submit quote for approval immediately
                </label>
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
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Create Quote
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