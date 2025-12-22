// components/quotes/CreateQuotePage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FileText, ArrowLeft, Save, Plus, Trash2,
  DollarSign, Percent, ShoppingBag, Loader2,
  Calendar, Building, Car, Eye, User,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { quoteService, QuoteItem } from '@/services/quoteService';
import { salesOrderService } from '@/services/salesOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function CreateQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    quoteNumber: '',
    opportunityId: '',
    vehicleId: '',
    items: [] as Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      sku?: string;
      taxRate?: number;
      discount?: number;
    }>,
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
    notes: '',
    terms: 'Payment due in 30 days. Prices subject to change.',
    validUntil: '',
    status: 'draft' as 'draft' | 'pending',
  });

  const taxRate = 16; // Default VAT rate in Kenya
  const orderId = searchParams.get('orderId');
  const source = searchParams.get('source');

  useEffect(() => {
    generateQuoteNumber();
    
    if (orderId && source === 'sales-order') {
      loadSalesOrderData(orderId);
    }
  }, [orderId, source]);

  const generateQuoteNumber = async () => {
    try {
      setGeneratingNumber(true);
      const number = await quoteService.generateQuoteNumber();
      setFormData(prev => ({ ...prev, quoteNumber: number }));
      
      // Set default valid until (30 days from now)
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      setFormData(prev => ({ 
        ...prev, 
        validUntil: thirtyDaysLater.toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Error generating quote number:', error);
      setFormData(prev => ({ 
        ...prev, 
        quoteNumber: `Q-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    } finally {
      setGeneratingNumber(false);
    }
  };

  const loadSalesOrderData = async (id: string) => {
    try {
      setLoading(true);
      const order = await salesOrderService.getSalesOrderById(id);
      setSalesOrder(order);
      
      // Pre-fill form with sales order data
      const items = order.lineItems?.map((item: any) => ({
        description: item.description || item.productName || 'Product/Service',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        sku: item.sku || ''
      })) || [];
      
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      const tax = subtotal * (taxRate / 100);
      const totalAmount = subtotal + tax;
      
      setFormData(prev => ({
        ...prev,
        opportunityId: typeof order.opportunityId === 'object' 
          ? order.opportunityId._id 
          : (order.opportunityId || ''),
        items,
        subtotal,
        tax,
        totalAmount,
        notes: `Quote generated from Sales Order ${order.salesOrderNumber}`,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
      
    } catch (error) {
      console.error('Error loading sales order:', error);
      showToast('Failed to load sales order data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (item: any) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discountAmount = item.discount ? (itemTotal * item.discount / 100) : 0;
    const taxAmount = item.taxRate ? ((itemTotal - discountAmount) * item.taxRate / 100) : 0;
    return itemTotal - discountAmount + taxAmount;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const tax = subtotal * (taxRate / 100);
    const totalAmount = subtotal + tax;
    
    setFormData(prev => ({ ...prev, subtotal, tax, totalAmount }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate' || field === 'discount') {
      newItems[index] = {
        ...newItems[index],
        [field]: Number(value)
      };
      
      // Recalculate item total
      newItems[index].total = calculateItemTotal(newItems[index]);
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        description: '', 
        quantity: 1, 
        unitPrice: 0, 
        total: 0,
        sku: ''
      }]
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
      
      const quote = await quoteService.createQuote(quoteData);
      
      // Update sales order with quote ID if from sales order
      if (orderId && source === 'sales-order') {
        try {
          await salesOrderService.updateSalesOrder(orderId, { 
            quoteId: quote.id 
          } as any);
        } catch (updateError) {
          console.error('Error updating sales order:', updateError);
          // Continue even if update fails
        }
        
        showToast('Quote created and linked to sales order!', 'success');
        
        // Ask if user wants to create invoice
        setTimeout(() => {
          const createInvoice = window.confirm('Quote created successfully! Would you like to create an invoice now?');
          if (createInvoice) {
            router.push(`/invoices/create?quoteId=${quote.id}&orderId=${orderId}`);
            return;
          }
          router.push(`/quotes/${quote.id}`);
        }, 100);
        
      } else {
        showToast('Quote created successfully!', 'success');
        router.push(`/quotes/${quote.id}`);
      }
      
    } catch (error: any) {
      console.error('Error creating quote:', error);
      showToast(error.message || 'Failed to create quote', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      router.push(orderId ? `/orders/sales-orders/${orderId}` : '/quotes');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {salesOrder ? `Create Quote from ${salesOrder.salesOrderNumber}` : 'Create New Quote'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {salesOrder ? 'Quote will be linked to sales order' : 'Create a new quote document'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading || generatingNumber}
                className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Creating...' : 'Create Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sales Order Info Banner */}
              {salesOrder && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">Source Sales Order</h3>
                      <p className="text-gray-600">
                        {salesOrder.salesOrderNumber} • {salesOrderService.formatCurrency(salesOrder.totalAmount)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {typeof salesOrder.opportunityId === 'object' 
                            ? salesOrder.opportunityId.customer?.name
                            : 'N/A'
                          }
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${salesOrder.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                          {salesOrder.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/orders/sales-orders/${salesOrder._id}`}
                      className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Order
                    </Link>
                  </div>
                </div>
              )}

              {/* Quote Details Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quote Details</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          placeholder="Q-2024-001"
                          required
                          disabled={loading || generatingNumber}
                        />
                      </div>
                      {generatingNumber && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Generating quote number...
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Until *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={formData.validUntil}
                          onChange={(e) => handleInputChange('validUntil', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          placeholder="Enter Opportunity ID"
                          required
                          disabled={loading || !!salesOrder}
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          placeholder="Enter Vehicle ID"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                      placeholder="Payment terms, delivery conditions, etc..."
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Quote Items Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Quote Items</h2>
                    <p className="text-sm text-gray-600 mt-1">
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
                    <div key={index} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold">{index + 1}</span>
                          </div>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                            placeholder="Item description"
                            disabled={loading}
                          />
                        </div>
                        
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="0"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Item Total
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium">
                            {quoteService.formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  Financial Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="text-xl font-bold text-gray-900">
                        {quoteService.formatCurrency(formData.subtotal)}
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-600">Tax ({taxRate}% VAT)</p>
                      <p className="text-xl font-bold text-blue-700">
                        {quoteService.formatCurrency(formData.tax)}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {quoteService.formatCurrency(formData.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, status: 'pending' }));
                        handleSubmit(new Event('submit') as any);
                      }}
                      disabled={loading}
                      className="px-6 py-3 border border-green-300 bg-white text-green-700 rounded-xl hover:bg-green-50 font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Create & Submit
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating Quote...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Create Quote
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4">Quote Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {formData.status === 'draft' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {formData.status === 'draft' ? 'Draft Mode' : 'Pending Approval'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.status === 'draft' 
                        ? 'Save as draft for later editing' 
                        : 'Submit for customer approval'}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Quotes are valid for 30 days by default. Customers will receive email notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Tips */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gray-200">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <h4 className="font-medium text-gray-800">Quick Tips</h4>
              </div>
              
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Add detailed descriptions for clarity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Include all relevant terms and conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Set appropriate validity period</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Review all calculations before submitting</span>
                </li>
              </ul>
            </div>

            {/* Workflow Progress */}
            {salesOrder && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <h4 className="font-bold text-gray-800 mb-4">Workflow Progress</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Sales Order</p>
                      <p className="text-sm text-gray-600">Created and ready</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Create Quote</p>
                      <p className="text-sm text-gray-600">Current step</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-500">Create Invoice</p>
                      <p className="text-sm text-gray-400">Next step</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}