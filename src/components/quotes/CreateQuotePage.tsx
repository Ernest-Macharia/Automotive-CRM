'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FileText, ArrowLeft, Save, Plus, Trash2,
  DollarSign, ShoppingBag, Loader2,
  Calendar, Building, Car, Eye, User,
  CheckCircle, Clock, AlertCircle, Package,
  ChevronRight, Percent, Hash, MessageSquare,
  Download, Send, Copy, Calculator,
  Shield, FileCheck, Users, Phone, Mail,
  MapPin, CreditCard, Tag, BarChart,
  RefreshCw, Search, AlertTriangle, X,
  ChevronDown, Filter, Check, ExternalLink
} from 'lucide-react';
import { quoteService, type CreateQuoteData } from '@/services/quoteService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId?: string;
  serviceId?: string;
}

export default function CreateQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [loadingOpportunity, setLoadingOpportunity] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  
  // Tax settings
  const [taxRate, setTaxRate] = useState(16); // VAT in Kenya
  const [includeTax, setIncludeTax] = useState(true);
  
  const [formData, setFormData] = useState({
    quoteNumber: '',
    opportunityId: '',
    vehicleId: '',
    items: [] as QuoteItem[],
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
    notes: '',
    terms: 'Payment due within 30 days. 50% deposit required to commence work.',
    validityPeriod: 30, // days
  });

  // Opportunity selector modal state
  const [showOpportunitySelector, setShowOpportunitySelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const opportunityId = searchParams.get('opportunityId');
  const vehicleId = searchParams.get('vehicleId');

  useEffect(() => {
    
    // Generate quote number immediately
    generateQuoteNumber();
    
    // Load opportunity data if ID is provided
    if (opportunityId) {
      loadOpportunityData(opportunityId);
    }
    
    // Load vehicle data if ID is provided directly (not from opportunity)
    if (vehicleId && !opportunityId) {
      loadVehicleData(vehicleId);
    }
  }, [opportunityId, vehicleId]);

  // Load opportunities for selector
  useEffect(() => {
    if (showOpportunitySelector) {
      loadOpportunities();
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showOpportunitySelector]);

  // Filter opportunities based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOpportunities(opportunities);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = opportunities.filter(opp => 
      opp.subject.toLowerCase().includes(lowerSearchTerm) ||
      opp.customer?.name?.toLowerCase().includes(lowerSearchTerm) ||
      opp.customer?.email?.toLowerCase().includes(lowerSearchTerm) ||
      opp.customer?.phone?.toLowerCase().includes(lowerSearchTerm) ||
      opp.customer?.companyName?.toLowerCase().includes(lowerSearchTerm) ||
      opp.vehicles?.some(vehicle => 
        vehicle.registrationNumber?.toLowerCase().includes(lowerSearchTerm) ||
        vehicle.make?.toLowerCase().includes(lowerSearchTerm) ||
        vehicle.model?.toLowerCase().includes(lowerSearchTerm)
      )
    );
    setFilteredOpportunities(filtered);
  }, [searchTerm, opportunities]);

  const generateQuoteNumber = async () => {
    try {
      setGeneratingNumber(true);
      const number = await quoteService.generateQuoteNumber();
      setFormData(prev => ({ ...prev, quoteNumber: number }));
    } catch (error) {
      console.error('Error generating quote number:', error);
      // Fallback quote number with timestamp
      const timestamp = new Date().getTime().toString().slice(-6);
      const year = new Date().getFullYear();
      setFormData(prev => ({ 
        ...prev, 
        quoteNumber: `Q-${year}-${timestamp}`
      }));
    } finally {
      setGeneratingNumber(false);
    }
  };

  const loadOpportunities = async () => {
    try {
      setLoadingOpportunities(true);
      const response = await opportunityService.getOpportunitiesSimple({
        limit: 50,
      });
      setOpportunities(response.data || []);
      setFilteredOpportunities(response.data || []);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      showToast('Failed to load opportunities', 'error');
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const loadOpportunityData = async (id: string) => {
    try {
      setLoadingOpportunity(true);
      
      const opportunityData = await opportunityService.getOpportunityById(id);
      
      if (!opportunityData) {
        throw new Error('Opportunity not found');
      }
      
      setOpportunity(opportunityData);
      
      // Pre-fill form with opportunity data
      const items: QuoteItem[] = opportunityData.servicesProducts?.map((item: any) => ({
        description: item.title || item.description || 'Product/Service',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        total: item.total || (item.quantity || 1) * (item.unitPrice || item.price || 0),
        productId: item._id || item.id,
        serviceId: item.serviceId
      })) || [];
      
      // If no servicesProducts, create a default item
      if (items.length === 0) {
        items.push({
          description: opportunityData.subject || 'Service/Product',
          quantity: 1,
          unitPrice: opportunityData.total || 0,
          total: opportunityData.total || 0
        });
      }
      
      const subtotal = parseFloat(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
      const tax = includeTax ? parseFloat((subtotal * (taxRate / 100)).toFixed(2)) : 0;
      const totalAmount = parseFloat((subtotal + tax).toFixed(2));
      
      // Get vehicle ID from vehicles array if available
      const vehicleIdFromOpp = opportunityData.vehicles?.[0]?._id || opportunityData.vehicles?.[0]?.id || '';
      
      // Always use the provided ID, not opportunityData._id
      setFormData(prev => {
        const newData = {
          ...prev,
          opportunityId: id, // Use the parameter ID
          items,
          subtotal,
          tax,
          totalAmount,
          notes: `Quote for opportunity: ${opportunityData.subject}`,
          vehicleId: vehicleIdFromOpp
        };
        return newData;
      });
      
      // Load vehicle data from opportunity
      if (opportunityData.vehicles?.[0]) {
        const vehicleDataId = opportunityData.vehicles[0]._id || opportunityData.vehicles[0].id;
        await loadVehicleData(vehicleDataId);
      }
      
    } catch (error) {
      console.error('Error loading opportunity:', error);
      showToast('Failed to load opportunity data. You can still create a quote manually.', 'error');
      
      // Still set the ID and add a default item
      setFormData(prev => {
        const newData = { 
          ...prev, 
          opportunityId: id,
          items: prev.items.length === 0 ? [{
            description: 'Service/Product',
            quantity: 1,
            unitPrice: 0,
            total: 0
          }] : prev.items
        };
        return newData;
      });
    } finally {
      setLoadingOpportunity(false);
    }
  };

  const loadVehicleData = async (id: string) => {
    try {
      setLoadingVehicle(true);
      const vehicleData = await vehicleService.getVehicleById(id);
      setVehicle(vehicleData);
      setFormData(prev => ({ ...prev, vehicleId: vehicleData._id || vehicleData.id }));
    } catch (error) {
      console.error('Error loading vehicle:', error);
      // Don't show error if vehicle not found - it's optional
    } finally {
      setLoadingVehicle(false);
    }
  };

  const calculateItemTotal = (quantity: number, unitPrice: number): number => {
    return parseFloat((quantity * unitPrice).toFixed(2));
  };

  const calculateTotals = (items: QuoteItem[]) => {
    const subtotal = parseFloat(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    const tax = includeTax ? parseFloat((subtotal * (taxRate / 100)).toFixed(2)) : 0;
    const totalAmount = parseFloat((subtotal + tax).toFixed(2));
    
    return { subtotal, tax, totalAmount };
  };

  const updateItemTotal = (index: number) => {
    const newItems = [...formData.items];
    const item = newItems[index];
    item.total = calculateItemTotal(item.quantity, item.unitPrice);
    newItems[index] = item;
    
    const { subtotal, tax, totalAmount } = calculateTotals(newItems);
    
    setFormData(prev => ({ 
      ...prev, 
      items: newItems,
      subtotal,
      tax,
      totalAmount
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'taxRate') {
      setTaxRate(value);
      const { subtotal, tax, totalAmount } = calculateTotals(formData.items);
      setFormData(prev => ({ ...prev, tax, totalAmount }));
    } else if (field === 'includeTax') {
      setIncludeTax(value);
      const tax = value ? formData.subtotal * (taxRate / 100) : 0;
      const totalAmount = formData.subtotal + tax;
      setFormData(prev => ({ ...prev, tax, totalAmount }));
    } else if (field === 'opportunityId') {
      // Manual entry of opportunity ID
      setFormData(prev => ({ ...prev, opportunityId: value }));
      if (value && value.trim()) {
        loadOpportunityData(value.trim());
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    
    if (field === 'description') {
      newItems[index].description = value.toString();
    } else if (field === 'quantity' || field === 'unitPrice') {
      newItems[index][field] = parseFloat(value.toString());
      // Recalculate item total
      updateItemTotal(index);
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    const newItems = [...formData.items, { 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      total: 0
    }];
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      const { subtotal, tax, totalAmount } = calculateTotals(newItems);
      
      setFormData(prev => ({ 
        ...prev, 
        items: newItems,
        subtotal,
        tax,
        totalAmount
      }));
    }
  };

  const duplicateItem = (index: number) => {
    const newItems = [...formData.items];
    const itemToDuplicate = { ...newItems[index], description: `${newItems[index].description} (Copy)` };
    newItems.splice(index + 1, 0, itemToDuplicate);
    
    const { subtotal, tax, totalAmount } = calculateTotals(newItems);
    
    setFormData(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      tax,
      totalAmount
    }));
  };

  const validateForm = (): boolean => {
    
    // Check opportunity ID - allow manual entry if not from URL
    if (!formData.opportunityId || !formData.opportunityId.trim()) {
      console.error('Opportunity ID is missing or empty:', formData.opportunityId);
      showToast('Please select an opportunity or enter an Opportunity ID', 'error');
      return false;
    }
    
    // Check if opportunity ID is a valid string
    if (typeof formData.opportunityId !== 'string') {
      console.error('Opportunity ID is not a string:', typeof formData.opportunityId);
      showToast('Invalid Opportunity ID format', 'error');
      return false;
    }
    
    // Check items
    if (formData.items.length === 0) {
      showToast('At least one item is required', 'error');
      return false;
    }
    
    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      
      if (!item.description || !item.description.trim()) {
        showToast(`Item ${i + 1}: Description is required`, 'error');
        return false;
      }
      
      if (item.quantity <= 0 || isNaN(item.quantity)) {
        showToast(`Item ${i + 1}: Quantity must be greater than 0`, 'error');
        return false;
      }
      
      if (item.unitPrice < 0 || isNaN(item.unitPrice)) {
        showToast(`Item ${i + 1}: Unit price cannot be negative`, 'error');
        return false;
      }
    }
    
    // Check total amount
    if (formData.totalAmount <= 0 || isNaN(formData.totalAmount)) {
      showToast('Total amount must be greater than 0', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.error('Form validation failed');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the formData opportunityId (which should be set)
      const finalOpportunityId = formData.opportunityId;
      
      if (!finalOpportunityId) {
        throw new Error('Opportunity ID is missing');
      }
      
      // Prepare data matching backend DTO
      const quoteData: CreateQuoteData = {
        quoteNumber: formData.quoteNumber || undefined,
        opportunityId: finalOpportunityId,
        vehicleId: formData.vehicleId || undefined,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        totalAmount: formData.totalAmount,
        notes: formData.notes || undefined,
      };
      
      const quote = await quoteService.createQuote(quoteData);
      showToast('Quote created successfully!', 'success');
      router.push(`/quotes/${quote.id}`);
      
    } catch (error: any) {
      console.error('Error creating quote:', error);
      
      // More detailed error handling
      if (error.response) {
        console.error('API Response error:', error.response.data);
        console.error('API Response status:', error.response.status);
        
        if (error.response.data?.message) {
          showToast(`API Error: ${error.response.data.message}`, 'error');
        } else if (error.response.data?.errors) {
          const errors = error.response.data.errors;
          const errorMessage = Object.values(errors).flat().join(', ');
          showToast(`Validation Error: ${errorMessage}`, 'error');
        } else {
          showToast(`Server error: ${error.response.status}`, 'error');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        showToast('No response from server. Please check your connection.', 'error');
      } else {
        showToast(error.message || 'Failed to create quote. Please check your data.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const quoteData: CreateQuoteData = {
        quoteNumber: formData.quoteNumber || undefined,
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId || undefined,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        totalAmount: formData.totalAmount,
        notes: formData.notes || undefined,
        status: 'draft'
      };
      
      const quote = await quoteService.createQuote(quoteData);
      
      showToast('Quote saved as draft!', 'success');
      router.push(`/quotes`);
      
    } catch (error: any) {
      console.error('Error saving draft:', error);
      showToast(error.message || 'Failed to save draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      if (opportunityId) {
        router.push(`/opportunities/${opportunityId}`);
      } else {
        router.push('/quotes');
      }
    }
  };

  const handleSelectOpportunity = (selectedOpportunity: Opportunity) => {
    const id = selectedOpportunity._id || selectedOpportunity.id;
    if (id) {
      setFormData(prev => ({ ...prev, opportunityId: id }));
      loadOpportunityData(id);
      setShowOpportunitySelector(false);
      setSearchTerm('');
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'KES 0';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status?: string): string => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'won': 'bg-green-100 text-green-800',
      'lost': 'bg-red-100 text-red-800',
      'prospecting': 'bg-yellow-100 text-yellow-800',
      'appointment_scheduled': 'bg-purple-100 text-purple-800',
      'attempted_to_contact': 'bg-orange-100 text-orange-800',
      'non_progressive': 'bg-gray-100 text-gray-800',
    };
    return colors[status || 'new'] || 'bg-gray-100 text-gray-800';
  };

  const getTierColor = (tier?: string): string => {
    const colors: Record<string, string> = {
      'hot': 'bg-red-100 text-red-800',
      'warm': 'bg-yellow-100 text-yellow-800',
      'cold': 'bg-blue-100 text-blue-800',
    };
    return colors[tier || 'cold'] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      {/* Opportunity Selector Modal */}
      {showOpportunitySelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select Opportunity</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose an opportunity to link to this quote
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOpportunitySelector(false);
                    setSearchTerm('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Search and Filter Bar */}
              <div className="mt-4 flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search opportunities by subject, customer, vehicle, or ID..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="appearance-none pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">All Opportunities</option>
                    <option value="service">Service Only</option>
                    <option value="sale">Sale Only</option>
                    <option value="hot">Hot Leads</option>
                    <option value="has_vehicles">Has Vehicles</option>
                  </select>
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingOpportunities ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">Loading opportunities...</p>
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try a different search term' : 'No opportunities available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOpportunities.map((opp) => (
                    <div
                      key={opp._id || opp.id}
                      className={`border rounded-xl p-4 hover:border-blue-300 cursor-pointer transition-colors ${
                        formData.opportunityId === (opp._id || opp.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleSelectOpportunity(opp)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opp.status)}`}>
                              {opp.status?.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            {opp.leadScore?.tier && (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(opp.leadScore.tier)}`}>
                                {opp.leadScore.tier.toUpperCase()}
                              </div>
                            )}
                            {opp.opportunityType && (
                              <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                {opp.opportunityType}
                              </div>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 mb-1">{opp.subject}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            {/* Customer Info */}
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{opp.customer?.name || 'Unknown customer'}</p>
                                {opp.customer?.companyName && (
                                  <p className="text-xs text-gray-600">{opp.customer.companyName}</p>
                                )}
                                {opp.customer?.email && (
                                  <p className="text-xs text-gray-500">{opp.customer.email}</p>
                                )}
                                {opp.customer?.phone && (
                                  <p className="text-xs text-gray-500">{opp.customer.phone}</p>
                                )}
                              </div>
                            </div>

                            {/* Vehicle Info */}
                            <div className="flex items-start gap-2">
                              <Car className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                {opp.vehicles?.[0] ? (
                                  <>
                                    <p className="text-sm font-medium text-gray-900">
                                      {opp.vehicles[0].make} {opp.vehicles[0].model} {opp.vehicles[0].year}
                                    </p>
                                    {opp.vehicles[0].registrationNumber && (
                                      <p className="text-xs text-gray-600">
                                        {opp.vehicles[0].registrationNumber}
                                      </p>
                                    )}
                                    {opp.vehicles[0].color && (
                                      <p className="text-xs text-gray-500">Color: {opp.vehicles[0].color}</p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-500">No vehicle information</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Services/Products */}
                          {opp.servicesProducts && opp.servicesProducts.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">Services/Products:</p>
                              <div className="flex flex-wrap gap-1">
                                {opp.servicesProducts.slice(0, 3).map((item, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {item.title}
                                  </span>
                                ))}
                                {opp.servicesProducts.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    +{opp.servicesProducts.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Financial Info */}
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <div>
                              {opp.total && (
                                <p className="font-medium text-gray-900">
                                  Total: {formatCurrency(opp.total)}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                Created: {new Date(opp.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-center">
                          {formData.opportunityId === (opp._id || opp.id) ? (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSelectOpportunity(opp)}
                              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                            >
                              Select
                            </button>
                          )}
                          <Link
                            href={`/opportunities/${opp._id || opp.id}`}
                            target="_blank"
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filteredOpportunities.length} opportunity{filteredOpportunities.length !== 1 ? 's' : ''} found
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowOpportunitySelector(false);
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowOpportunitySelector(false);
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Header - Professional CRM Style */}
        <div className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {opportunity ? `New Quote for ${opportunity.subject}` : 'Create New Quote'}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Quotes</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>New</span>
                      {opportunity && (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          <span className="text-blue-600">{opportunity.subject}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAsDraft}
                  disabled={loading || generatingNumber || loadingOpportunity}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || generatingNumber || loadingOpportunity}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {loading ? 'Creating...' : 'Create & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Opportunity Selection Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Opportunity Selection</h2>
                <p className="text-sm text-gray-600">
                  {opportunity ? 'Linked to selected opportunity' : 'Select an opportunity to create quote for'}
                </p>
              </div>
              <button
                onClick={() => setShowOpportunitySelector(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <Search className="h-4 w-4" />
                {opportunity ? 'Change Opportunity' : 'Browse Opportunities'}
              </button>
            </div>

            {/* Selected Opportunity Display */}
            {opportunity ? (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(opportunity.status)}`}>
                        {opportunity.status?.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      {opportunity.leadScore?.tier && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(opportunity.leadScore.tier)}`}>
                          {opportunity.leadScore.tier.toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.subject}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-900">{opportunity.customer?.name || 'Unknown customer'}</span>
                          </div>
                          {opportunity.customer?.companyName && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{opportunity.customer.companyName}</span>
                            </div>
                          )}
                          {opportunity.customer?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <a href={`mailto:${opportunity.customer.email}`} className="text-blue-600 hover:underline">
                                {opportunity.customer.email}
                              </a>
                            </div>
                          )}
                          {opportunity.customer?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <a href={`tel:${opportunity.customer.phone}`} className="text-blue-600 hover:underline">
                                {opportunity.customer.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Information</h4>
                        {vehicle ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-900">
                                {vehicle.make} {vehicle.model} {vehicle.year}
                              </span>
                            </div>
                            {vehicle.registrationNumber && (
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">{vehicle.registrationNumber}</span>
                              </div>
                            )}
                            {vehicle.color && (
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: vehicle.color }}></span>
                                <span className="text-gray-700">Color: {vehicle.color}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">No vehicle information available</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Opportunity Summary */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500">Opportunity Type</p>
                          <p className="font-medium text-gray-900">{opportunity.opportunityType || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="font-medium text-gray-900">{formatCurrency(opportunity.total)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500">Created Date</p>
                          <p className="font-medium text-gray-900">{new Date(opportunity.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500">Lead Score</p>
                          <p className="font-medium text-gray-900">
                            {opportunity.leadScore?.totalScore || 0}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/opportunities/${opportunity._id || opportunity.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" />
                      View Opportunity
                    </button>
                    <button
                      onClick={() => setShowOpportunitySelector(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Change Selection
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunity Selected</h3>
                <p className="text-gray-600 mb-4">
                  Select an opportunity to automatically pre-fill customer and vehicle information
                </p>
                <button
                  onClick={() => setShowOpportunitySelector(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  Browse Opportunities
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Or{' '}
                  <button
                    onClick={() => document.getElementById('opportunityIdInput')?.focus()}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    enter Opportunity ID manually
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quote Details</h2>
                
                <div className="space-y-6">
                  {/* Quote Number & Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quote Number
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.quoteNumber}
                          onChange={(e) => handleInputChange('quoteNumber', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          placeholder="Auto-generated"
                          disabled={generatingNumber}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quote Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={new Date().toLocaleDateString()}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none"
                          readOnly
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
                          type="text"
                          value={new Date(Date.now() + formData.validityPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Opportunity ID Field (manual entry fallback) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opportunity ID *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="opportunityIdInput"
                        type="text"
                        value={formData.opportunityId}
                        onChange={(e) => handleInputChange('opportunityId', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="Enter Opportunity ID or select from list above"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {opportunity ? `Linked to: ${opportunity.subject}` : 'Select an opportunity above or enter ID manually'}
                    </p>
                  </div>

                  {/* Items Table - Professional CRM Style */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Quote Items</h3>
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
                    
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price (KES)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total (KES)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  placeholder="Item description"
                                  required
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                  className="w-24 px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  required
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                  className="w-32 px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  required
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {quoteService.formatCurrency(item.total)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => duplicateItem(index)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Duplicate item"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          
                          {formData.items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center">
                                <div className="text-gray-500">
                                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                  <p>No items added yet</p>
                                  <p className="text-sm mt-1">Click "Add Item" to start building your quote</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Internal)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                        placeholder="Internal notes about this quote..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Terms & Conditions
                      </label>
                      <textarea
                        value={formData.terms}
                        onChange={(e) => handleInputChange('terms', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                        placeholder="Payment terms and conditions..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Summary</h3>
                
                <div className="space-y-4">
                  {/* Tax Settings */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Percent className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Tax Settings</p>
                        <p className="text-sm text-gray-600">VAT {taxRate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeTax"
                          checked={includeTax}
                          onChange={(e) => handleInputChange('includeTax', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="includeTax" className="text-sm text-gray-700">
                          Include Tax
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                        disabled={!includeTax}
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{quoteService.formatCurrency(formData.subtotal)}</span>
                    </div>
                    
                    {includeTax && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tax ({taxRate}%)</span>
                        <span className="font-medium text-red-600">{quoteService.formatCurrency(formData.tax)}</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {quoteService.formatCurrency(formData.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...formData.items];
                          newItems.forEach((item, index) => updateItemTotal(index));
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Calculator className="h-4 w-4" />
                        Recalculate All
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAsDraft}
                        disabled={loading}
                        className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || generatingNumber || loadingOpportunity}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {loading ? 'Processing...' : 'Create & Send Quote'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Workflow Status */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-600" />
                  Workflow Status
                </h3>
                
                <div className="space-y-4">
                  {[
                    { status: 'opportunity', label: 'Opportunity Created', completed: !!opportunity, current: !!opportunity && !formData.opportunityId },
                    { status: 'quote', label: 'Create Quote', completed: false, current: true },
                    { status: 'approval', label: 'Approval', completed: false },
                    { status: 'invoice', label: 'Create Invoice', completed: false },
                    { status: 'payment', label: 'Payment', completed: false }
                  ].map((step, index) => (
                    <div key={step.status} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-100 text-green-600' :
                        step.current ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          step.completed ? 'text-green-700' :
                          step.current ? 'text-blue-700' :
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        {step.current && (
                          <p className="text-xs text-blue-600 mt-1">Current step</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quote Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Items</span>
                    <span className="font-medium text-gray-900">{formData.items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{quoteService.formatCurrency(formData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{quoteService.formatCurrency(formData.tax)}</span>
                  </div>
                  <div className="pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">
                        {quoteService.formatCurrency(formData.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Panel */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  {opportunity && (
                    <button
                      onClick={() => router.push(`/opportunities/${opportunity._id || opportunity.id}`)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Source Opportunity
                    </button>
                  )}
                  
                  {vehicle && (
                    <button
                      onClick={() => router.push(`/vehicles/${vehicle._id || vehicle.id}`)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <Car className="h-4 w-4" />
                      View Vehicle Details
                    </button>
                  )}
                  
                  <button
                    onClick={generateQuoteNumber}
                    disabled={generatingNumber}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                  >
                    {generatingNumber ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {generatingNumber ? 'Generating...' : 'Generate New Number'}
                  </button>
                </div>
              </div>

              {/* Help & Support */}
              <div className="bg-gray-50 rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  Need Help?
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  Questions about creating quotes? Contact our support team.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="h-3 w-3" />
                    <span>+254 700 123 456</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="h-3 w-3" />
                    <span>support@yourcrm.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
