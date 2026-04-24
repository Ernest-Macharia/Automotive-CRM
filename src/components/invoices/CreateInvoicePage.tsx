'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Receipt, ArrowLeft, Save, Plus, Trash2,
  DollarSign, Percent, ShoppingBag, Loader2,
  Calendar, Building, User, CreditCard, FileText,
  Eye, CheckCircle, Clock, TrendingUp, Calculator,
  BarChart3, Package, Sparkles, Shield, Check,
  Layers, Target, FileCheck, Download, Send,
  Search, ChevronDown, Car, Briefcase, Wrench,
  FileSpreadsheet, Users, MapPin, Phone, Mail
} from 'lucide-react';
import { invoiceService, type CreateInvoiceData } from '@/services/invoiceService';
import { opportunityService, type Opportunity } from '@/services/opportunityService';
import { salesOrderService, type SalesOrder } from '@/services/salesOrderService';
import { workOrderService, type WorkOrder } from '@/services/workOrderService';
import { quoteService, type Quote } from '@/services/quoteService';
import { jobCardService, type JobCard } from '@/services/jobCardService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import debounce from 'lodash/debounce';

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState<CreateInvoiceData>({
    opportunityId: '',
    quoteId: '',
    jobCardId: '',
    vehicleId: '',
    items: [],
    dueDate: '',
    paymentMethod: '',
    notes: '',
  });

  // Selection states
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  // Dropdown visibility
  const [showOpportunityDropdown, setShowOpportunityDropdown] = useState(false);
  const [showQuoteDropdown, setShowQuoteDropdown] = useState(false);
  const [showJobCardDropdown, setShowJobCardDropdown] = useState(false);
  const [showWorkOrderDropdown, setShowWorkOrderDropdown] = useState(false);
  const [showSalesOrderDropdown, setShowSalesOrderDropdown] = useState(false);
  
  // Search terms
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [jobCardSearch, setJobCardSearch] = useState('');
  
  // Selected items for display
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  
  // Backend data
  const [vehicles, setVehicles] = useState<any[]>([]);

  const quoteId = searchParams.get('quoteId');
  const opportunityId = searchParams.get('opportunityId');
  const salesOrderId = searchParams.get('salesOrderId');
  const workOrderId = searchParams.get('workOrderId');

  useEffect(() => {
    if (quoteId) {
      loadQuoteData(quoteId);
    } else if (opportunityId) {
      handleSelectOpportunity(opportunityId);
    } else if (salesOrderId) {
      handleSelectSalesOrderById(salesOrderId);
    } else if (workOrderId) {
      handleSelectWorkOrderById(workOrderId);
    } else {
      // Load opportunities for selection
      loadOpportunities();
    }
    
    // Set default due date (30 days from now)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    setFormData(prev => ({ 
      ...prev, 
      dueDate: thirtyDaysLater.toISOString().split('T')[0]
    }));
  }, []);

  const loadQuoteData = async (id: string) => {
    try {
      setLoading(true);
      const quoteData = await quoteService.getQuoteById(id);
      setQuote(quoteData);
      setSelectedQuote(quoteData);
      
      // Pre-fill form with quote data
      const items = quoteData.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      
      setFormData(prev => ({
        ...prev,
        opportunityId: typeof quoteData.opportunityId === 'object' 
          ? quoteData.opportunityId._id || quoteData.opportunityId.id 
          : quoteData.opportunityId,
        quoteId: quoteData._id || quoteData.id || '',
        items,
        notes: `Invoice generated from Quote ${quoteData.quoteNumber}`,
      }));
      
      // Load related data
      if (quoteData.opportunityId) {
        const oppId = typeof quoteData.opportunityId === 'object' 
          ? quoteData.opportunityId._id 
          : quoteData.opportunityId;
        await loadOpportunityDetails(oppId);
      }
      
    } catch (error) {
      console.error('Error loading quote:', error);
      showToast('Failed to load quote data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async (search = '') => {
    try {
      setSearching(true);
      const response = await opportunityService.filterOpportunities({
        search,
        limit: 10,
        sort: 'createdAt:desc'
      });
      setOpportunities(response.data || []);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setSearching(false);
    }
  };

  const loadOpportunityDetails = async (opportunityId: string) => {
    try {
      const opportunity = await opportunityService.getOpportunityById(opportunityId);
      setSelectedOpportunity(opportunity);
      
      // Load related quotes
      const quotesResponse = await quoteService.getQuotesByOpportunity(opportunityId);
      setQuotes(quotesResponse);
      
      // Load related job cards if any
      const jobCardsResponse = await jobCardService.getJobCardsByOpportunity(opportunityId);
      setJobCards(jobCardsResponse);
      
      // Load vehicles
      if (opportunity.vehicles && opportunity.vehicles.length > 0) {
        setVehicles(opportunity.vehicles);
        // Auto-select first vehicle if only one
        if (opportunity.vehicles.length === 1) {
          setFormData(prev => ({ ...prev, vehicleId: opportunity.vehicles[0]._id }));
        }
      }
      
      // Load work orders
      const workOrdersResponse = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
      setWorkOrders(workOrdersResponse);
      
      // Load sales orders
      const salesOrdersResponse = await salesOrderService.getSalesOrdersByOpportunity(opportunityId);
      setSalesOrders(salesOrdersResponse);
      
    } catch (error) {
      console.error('Error loading opportunity details:', error);
    }
  };

  const debouncedSearchOpportunities = useCallback(
    debounce((searchTerm: string) => {
      loadOpportunities(searchTerm);
    }, 300),
    []
  );

  const handleSelectOpportunity = async (opportunityId: string) => {
    try {
      setLoading(true);
      await loadOpportunityDetails(opportunityId);
      
      setFormData(prev => ({ ...prev, opportunityId }));
      setShowOpportunityDropdown(false);
      setOpportunitySearch('');
      
    } catch (error) {
      console.error('Error selecting opportunity:', error);
      showToast('Failed to load opportunity details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSalesOrderById = async (salesOrderId: string) => {
    try {
      const salesOrder = await salesOrderService.getSalesOrderById(salesOrderId);
      setSelectedSalesOrder(salesOrder);
      handleSelectSalesOrder(salesOrder);
      
      // Load the opportunity from sales order
      if (salesOrder.opportunityId) {
        const oppId = typeof salesOrder.opportunityId === 'object'
          ? salesOrder.opportunityId._id
          : salesOrder.opportunityId;
        await handleSelectOpportunity(oppId);
      }
    } catch (error) {
      console.error('Error loading sales order:', error);
    }
  };

  const handleSelectWorkOrderById = async (workOrderId: string) => {
    try {
      const workOrder = await workOrderService.getWorkOrderById(workOrderId);
      setSelectedWorkOrder(workOrder);
      handleSelectWorkOrder(workOrder);
      
      // Load the opportunity from work order
      if (workOrder.opportunityId) {
        const oppId = typeof workOrder.opportunityId === 'object'
          ? workOrder.opportunityId._id
          : workOrder.opportunityId;
        await handleSelectOpportunity(oppId);
      }
    } catch (error) {
      console.error('Error loading work order:', error);
    }
  };

  const handleSelectQuote = async (quote: Quote) => {
    setSelectedQuote(quote);
    setFormData(prev => ({ ...prev, quoteId: quote._id || quote.id || '' }));
    setShowQuoteDropdown(false);
    setQuoteSearch('');
    
    // Auto-fill items from quote
    const items = quote.items?.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })) || [];
    setFormData(prev => ({ ...prev, items }));
  };

  const handleSelectJobCard = (jobCard: JobCard) => {
    setSelectedJobCard(jobCard);
    setFormData(prev => ({ ...prev, jobCardId: jobCard._id || jobCard.id || '' }));
    setShowJobCardDropdown(false);
    setJobCardSearch('');
  };

  const handleSelectWorkOrder = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowWorkOrderDropdown(false);
  };

  const handleSelectSalesOrder = (salesOrder: SalesOrder) => {
    setSelectedSalesOrder(salesOrder);
    setShowSalesOrderDropdown(false);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setFormData(prev => ({ ...prev, vehicleId }));
  };

  const handleInputChange = (field: keyof CreateInvoiceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index] = {
        ...newItems[index],
        [field]: Number(value)
      };
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
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  // Calculate item total for display
  const calculateItemTotal = (item: any) => {
    return item.quantity * item.unitPrice;
  };

  // Calculate totals for display only
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const tax = subtotal * 0.16; // 16% VAT
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const totals = calculateTotals();

  const validateForm = () => {
    if (!formData.opportunityId.trim()) {
      showToast('Please select an opportunity', 'error');
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
    
    if (totals.total <= 0) {
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
      const invoice = await invoiceService.createInvoice(formData);
      
      showToast('Invoice created successfully!', 'success');
      
      setTimeout(() => {
        router.push(`/invoices/${invoice.id}`);
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
      router.push(quoteId ? `/quotes/${quoteId}` : '/invoices');
    }
  };

  const getOpportunitySubject = (opportunity: Opportunity | null): string => {
    if (!opportunity) return '';
    return opportunity.subject || '';
  };

  const getOpportunityId = (opportunity: Opportunity | null): string => {
    if (!opportunity) return '';
    return opportunity._id || opportunity.id || '';
  };

  const OpportunityDropdown = () => (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="invoice-opportunity-search"
            name="invoiceOpportunitySearch"
            type="text"
            value={opportunitySearch}
            onChange={(e) => {
              setOpportunitySearch(e.target.value);
              debouncedSearchOpportunities(e.target.value);
            }}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search opportunities..."
            autoFocus
          />
        </div>
      </div>
      {searching ? (
        <div className="p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No opportunities found
        </div>
      ) : (
        <div className="py-1">
          {opportunities.map((opp) => (
            <button
              key={opp._id}
              type="button"
              onClick={() => handleSelectOpportunity(opp._id || opp.id || '')}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{opp.subject}</div>
                  <div className="text-sm text-gray-600">{opp.customer?.name}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(opp.createdAt).toLocaleDateString()}
                </div>
              </div>
              {opp.leadScore?.tier && (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    opp.leadScore.tier === 'hot' ? 'bg-red-100 text-red-800' :
                    opp.leadScore.tier === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {opp.leadScore.tier}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const QuoteDropdown = () => (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="invoice-quote-search"
            name="invoiceQuoteSearch"
            type="text"
            value={quoteSearch}
            onChange={(e) => setQuoteSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search quotes..."
            autoFocus
          />
        </div>
      </div>
      {quotes.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No quotes found for this opportunity
        </div>
      ) : (
        <div className="py-1">
          {quotes
            .filter(q => !quoteSearch || 
              q.quoteNumber?.toLowerCase().includes(quoteSearch.toLowerCase()) ||
              (q.notes && q.notes.toLowerCase().includes(quoteSearch.toLowerCase())))
            .map((q) => (
              <button
                key={q._id}
                type="button"
                onClick={() => handleSelectQuote(q)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{q.quoteNumber}</div>
                    <div className="text-sm text-gray-600">
                      Total: {quoteService.formatCurrency(q.totalAmount || 0)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {q.items?.length || 0} items
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );

  const JobCardDropdown = () => (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
      {jobCards.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No job cards found for this opportunity
        </div>
      ) : (
        <div className="py-1">
          {jobCards.map((jc) => (
            <button
              key={jc._id}
              type="button"
              onClick={() => handleSelectJobCard(jc)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{jc.jobTitle || `Job Card #${jc.jobNumber}`}</div>
                  <div className="text-sm text-gray-600">
                    {jc.status && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        jc.status === 'completed' ? 'bg-green-100 text-green-800' :
                        jc.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {jc.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(jc.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {quote ? `Create Invoice from Quote ${quote.quoteNumber}` : 'Create New Invoice'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {quote ? 'Invoice will be linked to quote' : 'Create a new invoice document'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
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
              {quote && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">
                        Source Quote: {quote.quoteNumber}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getOpportunitySubject(selectedOpportunity)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {quoteService.formatCurrency(quote.totalAmount || 0)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/quotes/${quote._id || quote.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:text-blue-800 font-medium text-sm flex items-center gap-2 rounded-xl border border-blue-200 hover:border-blue-300 transition-all"
                    >
                      <Eye className="h-4 w-4" />
                      View Quote
                    </Link>
                  </div>
                </div>
              )}

              {/* Customer & Opportunity Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Customer & Opportunity</h2>
                    <p className="text-sm text-gray-600">Select the opportunity for this invoice</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Opportunity Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Opportunity *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowOpportunityDropdown(!showOpportunityDropdown)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors flex items-center justify-between bg-white"
                      >
                        {selectedOpportunity ? (
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{selectedOpportunity.subject}</div>
                            <div className="text-sm text-gray-600">
                              {selectedOpportunity.customer?.name}
                              {selectedOpportunity.customer?.companyName && ` • ${selectedOpportunity.customer.companyName}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Search and select an opportunity...</span>
                        )}
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </button>
                      {showOpportunityDropdown && <OpportunityDropdown />}
                    </div>
                  </div>

                  {/* Customer Information Display */}
                  {selectedOpportunity && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{selectedOpportunity.customer?.name}</span>
                            </div>
                            {selectedOpportunity.customer?.companyName && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Company:</span>
                                <span className="font-medium">{selectedOpportunity.customer.companyName}</span>
                              </div>
                            )}
                            {selectedOpportunity.customer?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{selectedOpportunity.customer.email}</span>
                              </div>
                            )}
                            {selectedOpportunity.customer?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{selectedOpportunity.customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Opportunity Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Type:</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                selectedOpportunity.type === 'organization' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {selectedOpportunity.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Status:</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                selectedOpportunity.status === 'won' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {selectedOpportunity.status}
                              </span>
                            </div>
                            {selectedOpportunity.leadScore?.tier && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Lead Tier:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  selectedOpportunity.leadScore.tier === 'hot' 
                                    ? 'bg-red-100 text-red-800' 
                                    : selectedOpportunity.leadScore.tier === 'warm'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {selectedOpportunity.leadScore.tier}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Selection */}
                  {vehicles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Vehicle
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {vehicles.map((vehicle) => (
                          <button
                            key={vehicle._id}
                            type="button"
                            onClick={() => handleSelectVehicle(vehicle._id)}
                            className={`p-3 border rounded-xl text-left transition-all ${
                              formData.vehicleId === vehicle._id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                                <Car className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {vehicle.make} {vehicle.model}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {vehicle.registrationNumber && `${vehicle.registrationNumber} • `}
                                  {vehicle.year && `${vehicle.year}`}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Documents Card */}
              {selectedOpportunity && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Related Documents</h2>
                      <p className="text-sm text-gray-600">Select related quotes, orders, or job cards</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quote Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link Quote
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowQuoteDropdown(!showQuoteDropdown)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors flex items-center justify-between bg-white"
                        >
                          {selectedQuote ? (
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{selectedQuote.quoteNumber}</div>
                              <div className="text-sm text-gray-600">
                                {quoteService.formatCurrency(selectedQuote.totalAmount || 0)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Select a quote...</span>
                          )}
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </button>
                        {showQuoteDropdown && <QuoteDropdown />}
                      </div>
                    </div>

                    {/* Job Card Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link Job Card
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowJobCardDropdown(!showJobCardDropdown)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors flex items-center justify-between bg-white"
                        >
                          {selectedJobCard ? (
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {selectedJobCard.jobTitle || `Job Card #${selectedJobCard.jobNumber}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {selectedJobCard.status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Select a job card...</span>
                          )}
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </button>
                        {showJobCardDropdown && <JobCardDropdown />}
                      </div>
                    </div>

                    {/* Work Order Display */}
                    {workOrders.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Work Orders
                        </label>
                        <div className="space-y-2">
                          {workOrders.slice(0, 3).map((wo) => (
                            <div
                              key={wo._id}
                              className="p-3 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-gray-900">{wo.workOrderNumber}</div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${workOrderService.getStatusColor(wo.status)}`}>
                                  {workOrderService.getStatusLabel(wo.status)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Total: {workOrderService.formatCurrency(wo.totalCost || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sales Order Display */}
                    {salesOrders.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sales Orders
                        </label>
                        <div className="space-y-2">
                          {salesOrders.slice(0, 3).map((so) => (
                            <div
                              key={so._id}
                              className="p-3 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-gray-900">{so.salesOrderNumber}</div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${salesOrderService.getStatusColor(so.status)}`}>
                                  {salesOrderService.getStatusLabel(so.status)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Total: {salesOrderService.formatCurrency(so.totalAmount || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Details Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice Details</h2>
                    <p className="text-sm text-gray-600">Payment and billing information</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="invoice-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          id="invoice-due-date"
                          name="dueDate"
                          type="date"
                          value={formData.dueDate || ''}
                          onChange={(e) => handleInputChange('dueDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="invoice-payment-method" className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          id="invoice-payment-method"
                          name="paymentMethod"
                          value={formData.paymentMethod || ''}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors appearance-none bg-white"
                          disabled={loading}
                        >
                          <option value="">Select Payment Method</option>
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="mobile_money">Mobile Money</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="invoice-notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      id="invoice-notes"
                      name="notes"
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none transition-colors"
                      placeholder="Additional notes for this invoice..."
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Items Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Invoice Items</h2>
                      <p className="text-sm text-gray-600">Products and services included</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-100 hover:to-blue-200 shadow-sm border border-blue-200 hover:border-blue-300 transition-all"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-gradient-to-r from-white to-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold">{index + 1}</span>
                          </div>
                          <input
                            id={`invoice-item-${index}-description`}
                            name={`items.${index}.description`}
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            placeholder="Item description *"
                            disabled={loading}
                            required
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label htmlFor={`invoice-item-${index}-quantity`} className="block text-xs font-medium text-gray-700 mb-2">
                            Quantity *
                          </label>
                          <input
                            id={`invoice-item-${index}-quantity`}
                            name={`items.${index}.quantity`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            disabled={loading}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`invoice-item-${index}-unit-price`} className="block text-xs font-medium text-gray-700 mb-2">
                            Unit Price (KES) *
                          </label>
                          <input
                            id={`invoice-item-${index}-unit-price`}
                            name={`items.${index}.unitPrice`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            disabled={loading}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Unit Total
                          </label>
                          <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-sm font-medium border border-blue-200">
                            {invoiceService.formatCurrency(calculateItemTotal(item))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Item Total
                          </label>
                          <div className="px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg text-sm font-medium border border-blue-300">
                            {invoiceService.formatCurrency(calculateItemTotal(item))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Financial Summary</h2>
                    <p className="text-sm text-gray-600">Invoice totals and calculations (Preview)</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="text-xl font-bold text-gray-900 mt-2">
                        {invoiceService.formatCurrency(totals.subtotal)}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
                      <p className="text-sm text-blue-600">Tax (16% VAT)</p>
                      <p className="text-xl font-bold text-blue-700 mt-2">
                        {invoiceService.formatCurrency(totals.tax)}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200 shadow-sm">
                      <p className="text-sm text-indigo-600">Total Amount</p>
                      <p className="text-2xl font-bold text-indigo-700 mt-2">
                        {invoiceService.formatCurrency(totals.total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Invoice...
                      </>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4" />
                        Create Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Quick Info</h3>
                  <p className="text-sm text-gray-600">Invoice details</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Items Count</span>
                  <span className="font-medium text-gray-800">{formData.items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Items Value</span>
                  <span className="font-medium text-gray-800">{invoiceService.formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tax Amount</span>
                  <span className="font-medium text-gray-800">{invoiceService.formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-800">Grand Total</span>
                  <span className="text-lg font-bold text-gray-900">{invoiceService.formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Related Documents Summary */}
            {selectedOpportunity && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Linked Documents</h3>
                    <p className="text-sm text-gray-600">Will be attached to invoice</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {selectedQuote && (
                    <div className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{selectedQuote.quoteNumber}</div>
                          <div className="text-xs text-gray-600">Quote</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedJobCard && (
                    <div className="p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">
                            {selectedJobCard.jobTitle || `Job Card #${selectedJobCard.jobNumber}`}
                          </div>
                          <div className="text-xs text-gray-600">Job Card</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {workOrders.length > 0 && (
                    <div className="p-2 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{workOrders.length} Work Orders</div>
                          <div className="text-xs text-gray-600">Attached to opportunity</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {salesOrders.length > 0 && (
                    <div className="p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{salesOrders.length} Sales Orders</div>
                          <div className="text-xs text-gray-600">Attached to opportunity</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {vehicles.length > 0 && (
                    <div className="p-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{vehicles.length} Vehicles</div>
                          <div className="text-xs text-gray-600">
                            {formData.vehicleId ? '1 selected' : 'None selected'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Pro Tips
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  Select an opportunity to auto-fill customer details
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  Link quotes to auto-fill invoice items
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  All linked documents will be referenced in the final invoice
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
