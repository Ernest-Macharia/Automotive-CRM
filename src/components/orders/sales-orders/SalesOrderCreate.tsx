// components/salesorders/SalesOrderCreate.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, ArrowLeft, Save, Plus, Trash2,
  Loader2, FileText, Calendar, User, Package,
  Clock, DollarSign, CheckCircle, Search, X,
  Info, Building2, Phone, Mail, MapPin, Truck,
  CreditCard, Percent, Tag, Download, Printer
} from 'lucide-react';
import { salesOrderService, CreateSalesOrderData } from '@/services/salesOrderService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { quoteService } from '@/services/quoteService';
import { useToast } from '@/contexts/ToastContext';

interface FormData {
  opportunityId: string;
  quoteId: string;
  invoiceId: string;
  salesRep: string;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDeliveryDate: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  totalAmount: number;
  shippingAddress: string;
  billingAddress: string;
  paymentTerms: string;
  notes: string;
  // Additional fields
  searchOpportunity: string;
  selectedOpportunity: Opportunity | null;
  loadingOpportunity: boolean;
  lineItems: Array<{
    productId?: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  newLineItem: {
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
  };
}

interface SalesRep {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export default function SalesOrderCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [searchingOpportunity, setSearchingOpportunity] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showOpportunitySearch, setShowOpportunitySearch] = useState(false);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loadingSalesReps, setLoadingSalesReps] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    opportunityId: '',
    quoteId: '',
    invoiceId: '',
    salesRep: '',
    status: 'draft',
    orderDate: new Date().toISOString().split('T')[0],
    estimatedDeliveryDate: '',
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    totalAmount: 0,
    shippingAddress: '',
    billingAddress: '',
    paymentTerms: '',
    notes: '',
    searchOpportunity: '',
    selectedOpportunity: null,
    loadingOpportunity: false,
    lineItems: [],
    newLineItem: {
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0
    }
  });

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: FileText, color: 'bg-gray-100 text-gray-700' },
    { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
    { value: 'processing', label: 'Processing', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-700' },
    { value: 'delivered', label: 'Delivered', icon: Package, color: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: 'Cancelled', icon: X, color: 'bg-red-100 text-red-700' }
  ];

  const paymentTermsOptions = [
    { value: 'due_on_receipt', label: 'Due on Receipt' },
    { value: 'net_15', label: 'Net 15' },
    { value: 'net_30', label: 'Net 30' },
    { value: 'net_45', label: 'Net 45' },
    { value: 'net_60', label: 'Net 60' },
    { value: 'custom', label: 'Custom' }
  ];

  // Load sales reps on mount
  useEffect(() => {
    loadSalesReps();
  }, []);

  // Calculate totals whenever line items or tax/shipping/discount change
  useEffect(() => {
    calculateTotals();
  }, [formData.lineItems, formData.tax, formData.shipping, formData.discount]);

  const loadSalesReps = async () => {
    try {
      setLoadingSalesReps(true);
      const reps = await opportunityService.getAvailableSalesReps();
      setSalesReps(reps);
    } catch (error) {
      console.error('Error loading sales reps:', error);
    } finally {
      setLoadingSalesReps(false);
    }
  };

  const searchOpportunities = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setOpportunities([]);
      return;
    }

    try {
      setSearchingOpportunity(true);
      const response = await opportunityService.searchOpportunities(searchTerm);
      // Filter for SALE type opportunities
      const saleOpportunities = (response.data || []).filter(
        opp => opp.opportunityType === 'SALE' || !opp.opportunityType
      );
      setOpportunities(saleOpportunities);
    } catch (error) {
      console.error('Error searching opportunities:', error);
      showToast('Failed to search opportunities', 'error');
    } finally {
      setSearchingOpportunity(false);
    }
  };

  const loadOpportunityQuotes = async (opportunityId: string) => {
    try {
      setLoadingQuotes(true);
      const response = await quoteService.getQuotesByOpportunity(opportunityId);
      setQuotes(response || []);
      
      // Auto-select the latest quote if available
      if (response && response.length > 0) {
        const latestQuote = response[response.length - 1];
        setFormData(prev => ({
          ...prev,
          quoteId: latestQuote._id || latestQuote.id,
          // Pre-fill line items from quote if available
          lineItems: latestQuote.items?.map((item: any) => ({
            productName: item.description || 'Product',
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: (item.quantity || 1) * (item.unitPrice || 0)
          })) || []
        }));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      showToast('Failed to load quotes', 'error');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleSelectOpportunity = async (opportunity: Opportunity) => {
    // Only allow SALE type opportunities
    if (opportunity.opportunityType && opportunity.opportunityType !== 'SALE') {
      showToast('Please select a sales opportunity (type: SALE)', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      opportunityId: opportunity._id,
      selectedOpportunity: opportunity,
      searchOpportunity: opportunity.subject,
      // Auto-populate from opportunity
      salesRep: opportunity.assignedTo?._id || opportunity.assignedTo?.id || '',
      notes: `Sales order for: ${opportunity.subject}\nCustomer: ${opportunity.customer?.name || ''}`,
      // Pre-fill shipping/billing from customer if available
      shippingAddress: opportunity.customer?.companyAddress || '',
      billingAddress: opportunity.customer?.companyAddress || ''
    }));
    setShowOpportunitySearch(false);
    
    // Load quotes for this opportunity
    await loadOpportunityQuotes(opportunity._id);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'unitPrice' ? Number(value) : value
    };
    
    // Recalculate item total
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = 
        (updatedItems[index].quantity || 0) * (updatedItems[index].unitPrice || 0);
    }
    
    setFormData(prev => ({ ...prev, lineItems: updatedItems }));
  };

  const handleAddLineItem = () => {
    if (!formData.newLineItem.productName.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }

    const newItem = {
      productName: formData.newLineItem.productName,
      description: formData.newLineItem.description,
      quantity: formData.newLineItem.quantity || 1,
      unitPrice: formData.newLineItem.unitPrice || 0,
      total: (formData.newLineItem.quantity || 1) * (formData.newLineItem.unitPrice || 0)
    };

    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
      newLineItem: {
        productName: '',
        description: '',
        quantity: 1,
        unitPrice: 0
      }
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = formData.tax || 0;
    const shipping = formData.shipping || 0;
    const discount = formData.discount || 0;
    const totalAmount = subtotal + tax + shipping - discount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      totalAmount
    }));
  };

  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.opportunityId) errors.push('Please select an opportunity');
    if (!formData.quoteId) errors.push('Please select a quote');
    if (formData.lineItems.length === 0) errors.push('Please add at least one line item');
    if (formData.subtotal < 0) errors.push('Subtotal cannot be negative');
    if (formData.tax < 0) errors.push('Tax cannot be negative');
    if (formData.shipping < 0) errors.push('Shipping cannot be negative');
    if (formData.discount < 0) errors.push('Discount cannot be negative');
    
    if (errors.length > 0) {
      showToast(errors.join('. '), 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const createData: CreateSalesOrderData = {
        opportunityId: formData.opportunityId,
        quoteId: formData.quoteId,
        invoiceId: formData.invoiceId || undefined,
        salesRep: formData.salesRep || undefined,
        status: formData.status,
        orderDate: formData.orderDate,
        estimatedDeliveryDate: formData.estimatedDeliveryDate || undefined,
        subtotal: formData.subtotal,
        tax: formData.tax,
        shipping: formData.shipping,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        shippingAddress: formData.shippingAddress || undefined,
        billingAddress: formData.billingAddress || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
        lineItems: formData.lineItems.map(item => ({
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }))
      };
      
      console.log('Submitting sales order data:', createData);
      
      const newSalesOrder = await salesOrderService.createSalesOrder(createData);
      showToast('Sales order created successfully!', 'success');
      
      router.push(`/salesorders/${newSalesOrder._id || newSalesOrder.id}`);
      
    } catch (error: any) {
      console.error('Error creating sales order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create sales order: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/salesorders');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Sales Order</h1>
                <p className="text-emerald-100 text-sm">
                  Create a sales order from an opportunity and quote
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 border border-white text-white font-semibold rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Sales Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
            
            {/* Opportunity Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                Select Opportunity <RequiredField />
              </h2>
              
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={formData.searchOpportunity}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, searchOpportunity: e.target.value }));
                        searchOpportunities(e.target.value);
                      }}
                      onFocus={() => setShowOpportunitySearch(true)}
                      placeholder="Search for a sales opportunity by subject or customer..."
                      className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                    />
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/opportunities/create?type=SALE')}
                    className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Sales Opp
                  </button>
                </div>
                
                {/* Search Results Dropdown */}
                {showOpportunitySearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                    {searchingOpportunity ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p>Searching...</p>
                      </div>
                    ) : opportunities.length > 0 ? (
                      opportunities.map((opp) => (
                        <button
                          key={opp._id}
                          type="button"
                          onClick={() => handleSelectOpportunity(opp)}
                          className="w-full p-4 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{opp.subject}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Customer: {opp.customer?.name || 'N/A'}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                                  SALE
                                </span>
                                {opp.total && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    {formatCurrency(opp.total)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(opp.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : formData.searchOpportunity ? (
                      <div className="p-4 text-center text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No sales opportunities found</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              {/* Selected Opportunity Summary */}
              {formData.selectedOpportunity && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formData.selectedOpportunity.subject}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{formData.selectedOpportunity.customer?.name || 'No customer'}</span>
                          </div>
                          {formData.selectedOpportunity.customer?.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{formData.selectedOpportunity.customer.email}</span>
                            </div>
                          )}
                          {formData.selectedOpportunity.customer?.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{formData.selectedOpportunity.customer.phone}</span>
                            </div>
                          )}
                          {formData.selectedOpportunity.customer?.companyName && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="h-4 w-4" />
                              <span>{formData.selectedOpportunity.customer.companyName}</span>
                            </div>
                          )}
                          {formData.selectedOpportunity.total && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="h-4 w-4" />
                              <span>Total: {formatCurrency(formData.selectedOpportunity.total)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        selectedOpportunity: null, 
                        opportunityId: '',
                        searchOpportunity: '',
                        quoteId: '',
                        lineItems: []
                      }))}
                      className="p-1 hover:bg-emerald-200 rounded"
                    >
                      <X className="h-4 w-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quote Selection */}
            {formData.opportunityId && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Select Quote <RequiredField />
                </h2>
                
                {loadingQuotes ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading quotes...</p>
                  </div>
                ) : quotes.length > 0 ? (
                  <div className="space-y-2">
                    {quotes.map((quote) => (
                      <label
                        key={quote._id || quote.id}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.quoteId === (quote._id || quote.id)
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="quoteId"
                            value={quote._id || quote.id}
                            checked={formData.quoteId === (quote._id || quote.id)}
                            onChange={handleChange}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                Quote #{quote.quoteNumber || 'N/A'}
                              </span>
                              <span className="text-emerald-600 font-semibold">
                                {formatCurrency(quote.totalAmount || 0)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {quote.items?.length || 0} items • Created: {new Date(quote.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No quotes found for this opportunity</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/quotes/create?opportunityId=${formData.opportunityId}`)}
                      className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Create a quote first
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-600" />
                Order Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sales Rep
                  </label>
                  <select
                    name="salesRep"
                    value={formData.salesRep}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {loadingSalesReps ? (
                      <option disabled>Loading...</option>
                    ) : (
                      salesReps.map(rep => (
                        <option key={rep._id} value={rep._id}>
                          {rep.firstName} {rep.lastName} - {rep.role || 'Sales Rep'}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  >
                    <option value="">Select Payment Terms</option>
                    {paymentTermsOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Dates
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Date
                  </label>
                  <input
                    type="date"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    name="estimatedDeliveryDate"
                    value={formData.estimatedDeliveryDate}
                    onChange={handleChange}
                    min={formData.orderDate}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-600" />
                Line Items <RequiredField />
              </h2>
              
              {/* Line Items List */}
              {formData.lineItems.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Product</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Description</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Qty</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Unit Price</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lineItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => handleLineItemChange(index, 'productName', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              placeholder="Product name"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                              className="w-28 px-2 py-1 border border-gray-300 rounded text-right"
                              min="0"
                              step="100"
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add New Line Item */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formData.newLineItem.productName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLineItem: { ...prev.newLineItem, productName: e.target.value }
                      }))}
                      placeholder="Product name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.newLineItem.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLineItem: { ...prev.newLineItem, description: e.target.value }
                      }))}
                      placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.newLineItem.quantity}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLineItem: { ...prev.newLineItem, quantity: Number(e.target.value) }
                      }))}
                      placeholder="Qty"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.newLineItem.unitPrice}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newLineItem: { ...prev.newLineItem, unitPrice: Number(e.target.value) }
                      }))}
                      placeholder="Unit Price"
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Financial Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtotal
                  </label>
                  <div className="text-xl font-bold text-gray-800 px-4 py-2 bg-gray-50 rounded-xl">
                    {formatCurrency(formData.subtotal)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax (KES)
                  </label>
                  <input
                    type="number"
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping (KES)
                  </label>
                  <input
                    type="number"
                    name="shipping"
                    value={formData.shipping}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (KES)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-emerald-800">Total Amount:</span>
                  <span className="text-2xl font-bold text-emerald-800">
                    {formatCurrency(formData.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Addresses
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Address
                  </label>
                  <textarea
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter shipping address"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address
                  </label>
                  <textarea
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter billing address"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Enter any additional notes or special instructions..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !formData.opportunityId || !formData.quoteId || formData.lineItems.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Sales Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Sales Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}