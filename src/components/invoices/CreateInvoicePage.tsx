// components/invoices/CreateInvoicePage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Receipt, ArrowLeft, Save, Plus, Trash2,
  DollarSign, Percent, ShoppingBag, Loader2,
  Calendar, Building, User, CreditCard, FileText,
  Eye, CheckCircle, Clock, TrendingUp, Calculator,
  BarChart3, Package, Sparkles
} from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { quoteService } from '@/services/quoteService';
import { salesOrderService } from '@/services/salesOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    opportunityId: '',
    quoteId: '',
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
    paidAmount: 0,
    balance: 0,
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    notes: '',
    terms: 'Payment due within 30 days. Late payments subject to 2% monthly interest.',
    paymentStatus: 'pending' as 'draft' | 'pending' | 'partially_paid',
  });

  const quoteId = searchParams.get('quoteId');
  const orderId = searchParams.get('orderId');
  const taxRate = 16; // Default VAT in Kenya

  useEffect(() => {
    generateInvoiceNumber();
    
    if (quoteId) {
      loadQuoteData(quoteId);
    } else if (orderId) {
      loadSalesOrderData(orderId);
    }
  }, [quoteId, orderId]);

  const generateInvoiceNumber = async () => {
    try {
      setGeneratingNumber(true);
      const number = await invoiceService.generateInvoiceNumber();
      setFormData(prev => ({ ...prev, invoiceNumber: number }));
      
      // Set default due date (30 days from now)
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      setFormData(prev => ({ 
        ...prev, 
        dueDate: thirtyDaysLater.toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setFormData(prev => ({ 
        ...prev, 
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    } finally {
      setGeneratingNumber(false);
    }
  };

  const loadQuoteData = async (id: string) => {
    try {
      setLoading(true);
      const quoteData = await quoteService.getQuoteById(id);
      setQuote(quoteData);
      
      // Pre-fill form with quote data
      const items = quoteData.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        sku: item.sku || '',
        taxRate: item.taxRate,
        discount: item.discount
      }));
      
      setFormData({
        invoiceNumber: '',
        opportunityId: quoteData.opportunityId,
        quoteId: quoteData.id,
        items,
        subtotal: quoteData.subtotal,
        tax: quoteData.tax,
        totalAmount: quoteData.totalAmount,
        paidAmount: 0,
        balance: quoteData.totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        notes: `Invoice generated from Quote ${quoteData.quoteNumber}`,
        terms: 'Payment due within 30 days. Late payments subject to 2% monthly interest.',
        paymentStatus: 'pending'
      });
      
      if (orderId) {
        try {
          const order = await salesOrderService.getSalesOrderById(orderId);
          setSalesOrder(order);
        } catch (error) {
          console.error('Error loading sales order:', error);
        }
      }
      
    } catch (error) {
      console.error('Error loading quote:', error);
      showToast('Failed to load quote data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesOrderData = async (id: string) => {
    try {
      setLoading(true);
      const order = await salesOrderService.getSalesOrderById(id);
      setSalesOrder(order);
      
      const items = order.lineItems?.map((item: any) => ({
        description: item.description || item.productName || 'Product/Service',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        sku: item.sku || ''
      })) || [];
      
    //   if (items.length === 0) {
    //     items.push({
    //       description: 'Product/Service',
    //       quantity: 1,
    //       unitPrice: order.totalAmount || 0,
    //       total: order.totalAmount || 0
    //     });
    //   }
      
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
        balance: totalAmount,
        notes: `Invoice generated from Sales Order ${order.salesOrderNumber}`,
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
    const balance = totalAmount - formData.paidAmount;
    
    setFormData(prev => ({ 
      ...prev, 
      subtotal, 
      tax, 
      totalAmount,
      balance 
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.paidAmount]);

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
    if (!formData.invoiceNumber.trim()) {
      showToast('Invoice number is required', 'error');
      return false;
    }
    
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

      const safePaymentStatus = formData.paymentStatus === 'partially_paid' 
        ? 'pending'
        : formData.paymentStatus;

      const invoiceData = {
        opportunityId: formData.opportunityId,
        quoteId: formData.quoteId,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          sku: item.sku,
          taxRate: item.taxRate,
          discount: item.discount
        })),
        subtotal: formData.subtotal,
        tax: formData.tax,
        total: formData.totalAmount,
        dueDate: formData.dueDate,
        notes: formData.notes,
        terms: formData.terms,
        paymentStatus: safePaymentStatus,
      };
      
      const invoice = await invoiceService.createInvoice(invoiceData);
      
      if (orderId) {
        try {
          await salesOrderService.updateSalesOrder(orderId, { invoiceId: invoice.id } as any);
        } catch (updateError) {
          console.error('Error updating sales order:', updateError);
        }
        showToast('Invoice created and linked to sales order!', 'success');
      } else {
        showToast('Invoice created successfully!', 'success');
      }
      
      setTimeout(() => {
        const recordPayment = window.confirm('Invoice created successfully! Would you like to record a payment now?');
        if (recordPayment) {
          router.push(`/invoices/${invoice.id}/pay`);
        } else {
          router.push(`/invoices/${invoice.id}`);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      showToast(error.message || 'Failed to create invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      router.push(quoteId ? `/quotes/${quoteId}` : 
                orderId ? `/orders/sales-orders/${orderId}` : '/invoices');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 shadow-lg">
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
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {quote ? `Create Invoice from Quote ${quote.quoteNumber}` : 
                   salesOrder ? `Create Invoice from ${salesOrder.salesOrderNumber}` : 
                   'Create New Invoice'}
                </h1>
                <p className="text-purple-100 text-sm">
                  {quote ? 'Invoice will be linked to quote' : 
                   salesOrder ? 'Invoice will be linked to sales order' : 
                   'Create a new invoice document'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading || generatingNumber}
                className="px-6 py-2 bg-white text-purple-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Creating...' : 'Create Invoice'}
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
              {/* Source Information Banner */}
              {(quote || salesOrder) && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                      {quote ? <FileText className="h-6 w-6 text-white" /> : 
                              <ShoppingBag className="h-6 w-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">
                        {quote ? `Source Quote: ${quote.quoteNumber}` : 
                                `Source Sales Order: ${salesOrder?.salesOrderNumber}`}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {quote ? quote.opportunityId.substring(0, 12) + '...' :
                                  typeof salesOrder?.opportunityId === 'object' 
                                    ? salesOrder.opportunityId.customer?.name
                                    : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {quote ? quoteService.formatCurrency(quote.totalAmount) :
                                  salesOrderService.formatCurrency(salesOrder?.totalAmount || 0)}
                        </span>
                      </div>
                    </div>
                    {quote && (
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Quote
                      </Link>
                    )}
                    {salesOrder && (
                      <Link
                        href={`/orders/sales-orders/${salesOrder._id}`}
                        className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Order
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Details Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
                    <Receipt className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice Details</h2>
                    <p className="text-sm text-gray-600">Basic invoice information</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Number *
                      </label>
                      <div className="relative">
                        <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.invoiceNumber}
                          onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          placeholder="INV-2024-001"
                          required
                          disabled={loading || generatingNumber}
                        />
                      </div>
                      {generatingNumber && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Generating invoice number...
                        </p>
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          placeholder="Enter Opportunity ID"
                          required
                          disabled={loading || !!quote || !!salesOrder}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) => handleInputChange('issueDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          disabled={loading}
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          required
                          disabled={loading}
                        />
                      </div>
                      {formData.dueDate && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due in {invoiceService.daysUntilDue(formData.dueDate)} days
                        </p>
                      )}
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none"
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none"
                      placeholder="Payment terms, late fees, etc..."
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Items Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Invoice Items</h2>
                      <p className="text-sm text-gray-600">Products and services included</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:from-purple-100 hover:to-purple-200 shadow-sm"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold">{index + 1}</span>
                          </div>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            placeholder="Item description"
                            disabled={loading}
                          />
                        </div>
                        
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            placeholder="0"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate || taxRate}
                            onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            placeholder={taxRate.toString()}
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Item Total
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium border border-gray-200">
                            {invoiceService.formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
                    <Calculator className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Financial Summary</h2>
                    <p className="text-sm text-gray-600">Invoice totals and calculations</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="text-xl font-bold text-gray-900 mt-2">
                        {invoiceService.formatCurrency(formData.subtotal)}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600">Tax ({taxRate}% VAT)</p>
                      <p className="text-xl font-bold text-purple-700 mt-2">
                        {invoiceService.formatCurrency(formData.tax)}
                      </p>
                    </div>
                    
                    <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                      <p className="text-sm text-pink-600">Total Amount</p>
                      <p className="text-2xl font-bold text-pink-700 mt-2">
                        {invoiceService.formatCurrency(formData.totalAmount)}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-300">
                      <p className="text-sm text-purple-700 font-medium">Balance Due</p>
                      <p className="text-2xl font-bold text-purple-800 mt-2">
                        {invoiceService.formatCurrency(formData.balance)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payment Status</span>
                      <select
                        value={formData.paymentStatus}
                        onChange={(e) => handleInputChange('paymentStatus', e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        disabled={loading}
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending Payment</option>
                        <option value="partially_paid">Partially Paid</option>
                      </select>
                    </div>
                    
                    {formData.paymentStatus === 'partially_paid' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount Paid
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            max={formData.totalAmount}
                            step="0.01"
                            value={formData.paidAmount}
                            onChange={(e) => handleInputChange('paidAmount', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter amount paid"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, paymentStatus: 'draft' }));
                        handleSubmit(new Event('submit') as any);
                      }}
                      disabled={loading}
                      className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
                    >
                      <Clock className="h-4 w-4" />
                      Save as Draft
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating Invoice...
                        </>
                      ) : (
                        <>
                          <Receipt className="h-4 w-4" />
                          Create Invoice & Continue
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
            {/* Workflow Progress */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Workflow Progress</h3>
                  <p className="text-sm text-gray-600">Sales order to invoice flow</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Sales Order</p>
                    <p className="text-sm text-gray-600">Created and confirmed</p>
                  </div>
                </div>
                
                {quote && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Quote Created</p>
                      <p className="text-sm text-gray-600">{quote.quoteNumber}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Generate Invoice</p>
                    <p className="text-sm text-gray-600">Fill details and confirm</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">Record Payment</p>
                    <p className="text-sm text-gray-400">After invoice creation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Pro Tips
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  Use <strong>discounts</strong> and <strong>tax rates</strong> per line item for precise billing.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  Save as <strong>Draft</strong> if you're not ready to send yet.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  Invoice numbers auto-generate but can be edited if needed.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}