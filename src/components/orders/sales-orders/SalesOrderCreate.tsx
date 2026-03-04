'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, ArrowLeft, Save, Loader2,
  Search, X, Package, CheckCircle
} from 'lucide-react';
import { salesOrderService } from '@/services/salesOrderService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';

interface FormData {
  opportunityId: string;
  quoteId: string;
  searchOpportunity: string;
  selectedOpportunity: Opportunity | null;
  showDropdown: boolean;
}

export default function SalesOrderCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    opportunityId: '',
    quoteId: '',
    searchOpportunity: '',
    selectedOpportunity: null,
    showDropdown: false
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setFormData(prev => ({ ...prev, showDropdown: false }));
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const searchOpportunities = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setOpportunities([]);
      return;
    }

    try {
      setSearching(true);
      const response = await opportunityService.searchOpportunities(searchTerm);
      // Filter for SALE type opportunities
      const saleOpportunities = (response.data || []).filter(
        opp => opp.opportunityType === 'SALE' || !opp.opportunityType
      );
      setOpportunities(saleOpportunities);
    } catch (error) {
      console.error('Error searching opportunities:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      searchOpportunity: value,
      showDropdown: true 
    }));
    searchOpportunities(value);
  };

  const handleSelectOpportunity = (opportunity: Opportunity) => {
    setFormData(prev => ({
      ...prev,
      opportunityId: opportunity._id,
      selectedOpportunity: opportunity,
      searchOpportunity: `${opportunity.subject} - ${opportunity.customer?.name || 'No customer'}`,
      showDropdown: false
    }));
    setOpportunities([]);
  };

  const handleClearOpportunity = () => {
    setFormData(prev => ({
      ...prev,
      opportunityId: '',
      selectedOpportunity: null,
      searchOpportunity: '',
      showDropdown: false
    }));
    setOpportunities([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.opportunityId) {
      showToast('Please select an opportunity', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create sales order with just the opportunity ID
      const createData = {
        opportunityId: formData.opportunityId,
        quoteId: formData.quoteId
      };
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 shadow-xl">
        <div className="max-w-4xl mx-auto">
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
                <h1 className="text-2xl font-bold text-white">Create Sales Order</h1>
                <p className="text-emerald-100 text-sm">Select an opportunity to create a sales order</p>
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
                disabled={loading || !formData.opportunityId}
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
      <div className="max-w-2xl mx-auto p-4 mt-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
            
            {/* Just the opportunity selector */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Opportunity <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={formData.searchOpportunity}
                  onChange={handleSearchChange}
                  onFocus={() => setFormData(prev => ({ ...prev, showDropdown: true }))}
                  placeholder="Search for a sales opportunity by subject or customer..."
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  autoComplete="off"
                />
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                
                {formData.selectedOpportunity && (
                  <button
                    type="button"
                    onClick={handleClearOpportunity}
                    className="absolute right-3 top-3.5 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {formData.showDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                  {searching ? (
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
                        className="w-full p-4 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{opp.subject}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Customer: {opp.customer?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {opp.opportunityType || 'SALE'} • Amount: {opp.total ? `KES ${opp.total.toLocaleString()}` : 'N/A'}
                        </div>
                      </button>
                    ))
                  ) : formData.searchOpportunity ? (
                    <div className="p-4 text-center text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No sales opportunities found</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>Type to search for opportunities</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Selected Opportunity Summary */}
            {formData.selectedOpportunity && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Selected Opportunity</h3>
                    <p className="text-sm text-gray-600 mt-1">{formData.selectedOpportunity.subject}</p>
                    <p className="text-sm text-gray-600">Customer: {formData.selectedOpportunity.customer?.name || 'N/A'}</p>
                    {formData.selectedOpportunity.total && (
                      <p className="text-sm text-gray-600">Amount: KES {formData.selectedOpportunity.total.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Simple form actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.opportunityId}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-lg disabled:opacity-50 flex items-center gap-2"
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
        </form>
      </div>
    </div>
  );
}
