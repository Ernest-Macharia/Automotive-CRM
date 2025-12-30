'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FileText, ArrowLeft, Save, Plus, Trash2,
  DollarSign, ShoppingBag, Loader2,
  Calendar, Building, Car, Eye, User,
  CheckCircle, Clock, AlertCircle, Package
} from 'lucide-react';
import { quoteService } from '@/services/quoteService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
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
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState({
    quoteNumber: '',
    opportunityId: '',
    vehicleId: '',
    items: [] as QuoteItem[],
    totalAmount: 0,
    notes: '',
  });

  const opportunityId = searchParams.get('opportunityId');
  const vehicleId = searchParams.get('vehicleId');

  useEffect(() => {
    generateQuoteNumber();
    
    // Load opportunity data if ID is provided
    if (opportunityId) {
      loadOpportunityData(opportunityId);
    }
  }, [opportunityId]);

  const generateQuoteNumber = async () => {
    try {
      setGeneratingNumber(true);
      const number = await quoteService.generateQuoteNumber();
      setFormData(prev => ({ ...prev, quoteNumber: number }));
    } catch (error) {
      console.error('Error generating quote number:', error);
      // Fallback quote number
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData(prev => ({ 
        ...prev, 
        quoteNumber: `Q-${year}-${random}`
      }));
    } finally {
      setGeneratingNumber(false);
    }
  };

  const loadOpportunityData = async (id: string) => {
    try {
      setLoadingOpportunity(true);
      const opportunityData = await opportunityService.getOpportunityById(id);
      setOpportunity(opportunityData);
      
      // Get first vehicle if available
      const firstVehicle = opportunityData.vehicles?.[0];
      const vehicleId = firstVehicle?._id || firstVehicle?.id;
      
      // Pre-fill form with opportunity data
      const items: QuoteItem[] = opportunityData.servicesProducts?.map((item: any) => ({
        description: item.title || item.description || 'Product/Service',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
        productId: item._id || item.id
      })) || [];
      
      // If no servicesProducts, create a default item
      if (items.length === 0) {
        items.push({
          description: 'Service for ' + (opportunityData.subject || 'Opportunity'),
          quantity: 1,
          unitPrice: opportunityData.total || 0,
          total: opportunityData.total || 0
        });
      }
      
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      setFormData(prev => ({
        ...prev,
        opportunityId: id,
        vehicleId: vehicleId || '',
        items,
        totalAmount,
        notes: `Quote for opportunity: ${opportunityData.subject}`
      }));
      
    } catch (error) {
      console.error('Error loading opportunity:', error);
      showToast('Failed to load opportunity data', 'error');
      // Still set the ID even if loading fails
      setFormData(prev => ({ ...prev, opportunityId: id }));
    } finally {
      setLoadingOpportunity(false);
    }
  };

  const calculateItemTotal = (quantity: number, unitPrice: number): number => {
    return quantity * unitPrice;
  };

  const calculateTotalAmount = (items: QuoteItem[]): number => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const updateItemTotal = (index: number) => {
    const newItems = [...formData.items];
    const item = newItems[index];
    item.total = calculateItemTotal(item.quantity, item.unitPrice);
    
    setFormData(prev => ({ 
      ...prev, 
      items: newItems,
      totalAmount: calculateTotalAmount(newItems)
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    
    if (field === 'description') {
      newItems[index] = { ...newItems[index], [field]: value.toString() };
    } else if (field === 'quantity' || field === 'unitPrice') {
      newItems[index] = { ...newItems[index], [field]: Number(value) };
      // Recalculate item total
      updateItemTotal(index);
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
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
      items: newItems,
      totalAmount: calculateTotalAmount(newItems)
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ 
        ...prev, 
        items: newItems,
        totalAmount: calculateTotalAmount(newItems)
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.opportunityId.trim()) {
      showToast('Opportunity ID is required', 'error');
      return false;
    }
    
    if (formData.items.length === 0) {
      showToast('At least one item is required', 'error');
      return false;
    }
    
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      
      if (!item.description.trim()) {
        showToast(`Item ${i + 1}: Description is required`, 'error');
        return false;
      }
      
      if (item.quantity <= 0) {
        showToast(`Item ${i + 1}: Quantity must be greater than 0`, 'error');
        return false;
      }
      
      if (item.unitPrice <= 0) {
        showToast(`Item ${i + 1}: Unit price must be greater than 0`, 'error');
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
      };
      
      const quote = await quoteService.createQuote(quoteData);
      
      showToast('Quote created successfully!', 'success');
      router.push(`/quotes/${quote.id}`);
      
    } catch (error: any) {
      console.error('Error creating quote:', error);
      showToast(error.message || 'Failed to create quote', 'error');
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
                  {opportunity ? `Create Quote for ${opportunity.subject}` : 'Create New Quote'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {opportunity ? 'Quote will be linked to opportunity' : 'Create a new quote document'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading || generatingNumber || loadingOpportunity}
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
              {/* Opportunity Info Banner */}
              {opportunity && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">Source Opportunity</h3>
                      <p className="text-gray-600">
                        {opportunity.subject} • {formatCurrency(opportunity.total || 0)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {opportunity.customer?.name}
                          {opportunity.customer?.companyName && ` • ${opportunity.customer.companyName}`}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          opportunity.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          opportunity.status === 'won' ? 'bg-green-100 text-green-800' :
                          opportunity.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {opportunity.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/opportunities/${opportunity._id || opportunity.id}`}
                      className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Opportunity
                    </Link>
                  </div>
                </div>
              )}

              {/* Vehicle Info Banner */}
              {opportunity?.vehicles?.[0] && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">Vehicle Information</h3>
                      <p className="text-gray-600">
                        {opportunity.vehicles[0].registrationNumber || 'No registration'} • 
                        {opportunity.vehicles[0].make} {opportunity.vehicles[0].model} • 
                        {opportunity.vehicles[0].year}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {opportunity.vehicles[0].color && (
                          <span className="flex items-center gap-1">
                            Color: {opportunity.vehicles[0].color}
                          </span>
                        )}
                        {opportunity.vehicles[0].mileage && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Mileage: {opportunity.vehicles[0].mileage}
                          </span>
                        )}
                      </div>
                    </div>
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
                        Quote Number (Optional)
                        <span className="text-xs text-gray-500 ml-1">- Auto-generated if empty</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.quoteNumber}
                          onChange={(e) => handleInputChange('quoteNumber', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          placeholder="Will be auto-generated"
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
                        Opportunity ID
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.opportunityId}
                          readOnly
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {opportunity ? `Linked to: ${opportunity.subject}` : 'Loading opportunity...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle ID
                      </label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.vehicleId}
                          readOnly
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {opportunity?.vehicles?.[0] ? 
                          `Linked to: ${opportunity.vehicles[0].registrationNumber || 'No registration'} ${opportunity.vehicles[0].make} ${opportunity.vehicles[0].model}` : 
                          'No vehicle linked'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={quoteService.formatCurrency(formData.totalAmount)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none"
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated from items</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
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
                </div>
              </div>

              {/* Quote Items Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Quote Items</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {opportunity ? 'Items from opportunity' : 'Add items and services'}
                      {opportunity?.servicesProducts && ` • ${opportunity.servicesProducts.length} item(s) loaded`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Item
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
                            placeholder="Item description (e.g., Oil change, Brake repair)"
                            required
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
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
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
                            required
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
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Actions
                          </label>
                          <button
                            type="button"
                            onClick={() => updateItemTotal(index)}
                            className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                            disabled={loading}
                          >
                            Recalculate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {formData.items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      {loadingOpportunity ? (
                        <>
                          <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-spin" />
                          <p className="text-gray-600">Loading opportunity items...</p>
                        </>
                      ) : (
                        <>
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No items added yet</p>
                          <p className="text-sm text-gray-500 mt-1">Click "Add Custom Item" to start</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  Financial Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Total Amount</p>
                          <p className="text-3xl font-bold text-blue-800 mt-2">
                            {quoteService.formatCurrency(formData.totalAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formData.items.length} item(s)</p>
                          <button
                            type="button"
                            onClick={() => {
                              // Recalculate all items
                              const newItems = [...formData.items];
                              newItems.forEach((item, index) => {
                                item.total = calculateItemTotal(item.quantity, item.unitPrice);
                              });
                              setFormData(prev => ({
                                ...prev,
                                items: newItems,
                                totalAmount: calculateTotalAmount(newItems)
                              }));
                            }}
                            className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                            disabled={loading}
                          >
                            Recalculate All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-1">Note:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All amounts are in Kenyan Shillings (KES)</li>
                      <li>Item totals are calculated automatically as: Quantity × Unit Price</li>
                      <li>Total amount is the sum of all item totals</li>
                      <li>Items are prefilled from the opportunity if available</li>
                    </ul>
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
                      type="submit"
                      disabled={loading || generatingNumber || loadingOpportunity}
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
            {/* Opportunity Details */}
            {opportunity && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">Opportunity Details</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Building className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">{opportunity.subject}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Customer: {opportunity.customer?.name}
                        {opportunity.customer?.companyName && ` (${opportunity.customer.companyName})`}
                      </p>
                      {opportunity.customer?.email && (
                        <p className="text-xs text-gray-500 mt-1">{opportunity.customer.email}</p>
                      )}
                      {opportunity.customer?.phone && (
                        <p className="text-xs text-gray-500 mt-1">{opportunity.customer.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  {opportunity.vehicles?.[0] && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Car className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800">Vehicle</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {opportunity.vehicles[0].make} {opportunity.vehicles[0].model} {opportunity.vehicles[0].year}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Registration: {opportunity.vehicles[0].registrationNumber || 'N/A'} • 
                          Color: {opportunity.vehicles[0].color || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium text-gray-800">
                        {opportunity.status?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="font-medium text-gray-800">
                        {opportunity.opportunityType || 'SERVICE'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">
                      Quote will be created as draft. You can approve it later from the quotes page.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  <span>Review prefilled items from the opportunity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Adjust quantities and prices as needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Add custom items if required</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Double-check all calculations before submitting</span>
                </li>
              </ul>
            </div>

            {/* Workflow Progress */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-4">Workflow Progress</h4>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Opportunity Created</p>
                    <p className="text-sm text-gray-600">Customer request captured</p>
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
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">Approve Quote</p>
                    <p className="text-sm text-gray-400">Next step</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">Create Invoice</p>
                    <p className="text-sm text-gray-400">Future step</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}