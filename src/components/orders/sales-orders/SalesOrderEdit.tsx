'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ShoppingBag, ArrowLeft, Calendar, DollarSign, 
  Package, Truck, CheckCircle, Clock, AlertCircle,
  Save, X, Loader2, Plus, Trash2,
  MapPin, Building, ChevronDown
} from 'lucide-react';
import { salesOrderService, SalesOrder, CreateSalesOrderData, UpdateSalesOrderData } from '@/services/salesOrderService';
import { useToast } from '@/contexts/ToastContext';

interface SalesOrderLineItem {
  productId?: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SalesOrderFormData {
  salesOrderNumber: string;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  totalAmount: number;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  notes?: string;
  lineItems: SalesOrderLineItem[];
  opportunityId?: string;
  quoteId?: string;
}

export default function SalesOrderEdit() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salesOrder, setSalesOrder] = useState<SalesOrderFormData>({
    salesOrderNumber: salesOrderService.generateSalesOrderNumber(),
    status: 'draft',
    orderDate: new Date().toISOString().split('T')[0],
    estimatedDeliveryDate: '',
    actualDeliveryDate: '',
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    totalAmount: 0,
    shippingAddress: '',
    billingAddress: '',
    paymentTerms: 'Net 30',
    notes: '',
    lineItems: []
  });

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchSalesOrder(params.id as string);
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchSalesOrder = async (id: string) => {
    try {
      setLoading(true);
      const data = await salesOrderService.getSalesOrderById(id);
      
      const formData: SalesOrderFormData = {
        salesOrderNumber: data.salesOrderNumber,
        status: data.status,
        orderDate: data.orderDate.split('T')[0],
        estimatedDeliveryDate: data.estimatedDeliveryDate?.split('T')[0],
        actualDeliveryDate: data.actualDeliveryDate?.split('T')[0],
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        discount: data.discount,
        totalAmount: data.totalAmount,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        lineItems: data.lineItems || [],
        opportunityId: typeof data.opportunityId === 'string' ? data.opportunityId : data.opportunityId?._id,
        quoteId: typeof data.quoteId === 'string' ? data.quoteId : data.quoteId?._id
      };
      
      setSalesOrder(formData);
    } catch (error) {
      console.error('Error fetching sales order:', error);
      showToast('Failed to load sales order', 'error');
      router.push('/orders/sales-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setSalesOrder(prev => {
      const updated = { ...prev, [name]: newValue };
      if (['subtotal', 'tax', 'shipping', 'discount'].includes(name)) {
        const subtotal = updated.subtotal || 0;
        const tax = updated.tax || 0;
        const shipping = updated.shipping || 0;
        const discount = updated.discount || 0;
        updated.totalAmount = subtotal + tax + shipping - discount;
      }
      return updated;
    });
  };

  const handleStatusChange = (status: SalesOrderFormData['status']) => {
    setSalesOrder(prev => ({ ...prev, status }));
  };

  const handleLineItemChange = (index: number, field: keyof SalesOrderLineItem, value: string | number) => {
    setSalesOrder(prev => {
      const lineItems = [...(prev.lineItems || [])];
      if (lineItems[index]) {
        const updatedItem = {
          ...lineItems[index],
          [field]: typeof value === 'string' && field !== 'description' && field !== 'productName' && field !== 'productId' 
            ? parseFloat(value) || 0 
            : value
        };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        lineItems[index] = updatedItem;
      }
      const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const totalAmount = subtotal + (prev.tax || 0) + (prev.shipping || 0) - (prev.discount || 0);
      
      return {
        ...prev,
        lineItems,
        subtotal,
        totalAmount
      };
    });
  };

  const addLineItem = () => {
    setSalesOrder(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          productId: `prod_${Date.now()}`,
          productName: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0
        }
      ]
    }));
  };

  const removeLineItem = (index: number) => {
    setSalesOrder(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (params.id && params.id !== 'new') {
        const updateData: UpdateSalesOrderData = {
          status: salesOrder.status,
          orderDate: `${salesOrder.orderDate}T00:00:00.000Z`,
          estimatedDeliveryDate: salesOrder.estimatedDeliveryDate ? `${salesOrder.estimatedDeliveryDate}T00:00:00.000Z` : undefined,
          actualDeliveryDate: salesOrder.actualDeliveryDate ? `${salesOrder.actualDeliveryDate}T00:00:00.000Z` : undefined,
          subtotal: salesOrder.subtotal,
          tax: salesOrder.tax,
          shipping: salesOrder.shipping,
          discount: salesOrder.discount,
          totalAmount: salesOrder.totalAmount,
          shippingAddress: salesOrder.shippingAddress,
          billingAddress: salesOrder.billingAddress,
          paymentTerms: salesOrder.paymentTerms,
          notes: salesOrder.notes,
          lineItems: salesOrder.lineItems
        };
        await salesOrderService.updateSalesOrder(params.id as string, updateData);
        showToast('Sales order updated successfully!', 'success');
        router.push(`/orders/sales-orders/${params.id}`);
      } else {
        const createData: CreateSalesOrderData = {
          opportunityId: salesOrder.opportunityId || 'default-opportunity-id',
          quoteId: salesOrder.quoteId || 'default-quote-id',
          salesOrderNumber: salesOrder.salesOrderNumber,
          status: salesOrder.status,
          orderDate: `${salesOrder.orderDate}T00:00:00.000Z`,
          estimatedDeliveryDate: salesOrder.estimatedDeliveryDate ? `${salesOrder.estimatedDeliveryDate}T00:00:00.000Z` : undefined,
          subtotal: salesOrder.subtotal,
          tax: salesOrder.tax,
          shipping: salesOrder.shipping,
          discount: salesOrder.discount,
          totalAmount: salesOrder.totalAmount,
          shippingAddress: salesOrder.shippingAddress,
          billingAddress: salesOrder.billingAddress,
          paymentTerms: salesOrder.paymentTerms,
          notes: salesOrder.notes,
          lineItems: salesOrder.lineItems
        };
        const newOrder = await salesOrderService.createSalesOrder(createData);
        showToast('Sales order created successfully!', 'success');
        router.push(`/orders/sales-orders/${newOrder._id}`);
      }
    } catch (error) {
      console.error('Error saving sales order:', error);
      showToast('Failed to save sales order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (params.id && params.id !== 'new') {
      router.push(`/orders/sales-orders/${params.id}`);
    } else {
      router.push('/orders/sales-orders');
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Clock, color: 'bg-gray-100 text-gray-700' },
    { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
    { value: 'processing', label: 'Processing', icon: Package, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-700' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: 'Cancelled', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  ];

  const paymentTermsOptions = [
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Due on Receipt',
    '50% Advance, 50% on Delivery'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔵🟣 Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {params.id === 'new' ? 'Create New Sales Order' : 'Edit Sales Order'}
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm">
                  {params.id === 'new' ? 'Fill in the details below' : `Editing ${salesOrder.salesOrderNumber}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 text-white border border-white rounded-lg hover:bg-white/10 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                  saving
                    ? 'bg-blue-400 text-white'
                    : 'bg-white text-blue-600 hover:bg-gray-100'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleStatusChange(status.value as SalesOrderFormData['status'])}
                    className={`px-3 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1.5 text-xs border transition-colors ${
                      salesOrder.status === status.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${status.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Dates */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Dates
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Order Date
                    </label>
                    <input
                      type="date"
                      name="orderDate"
                      value={salesOrder.orderDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Estimated Delivery Date
                    </label>
                    <input
                      type="date"
                      name="estimatedDeliveryDate"
                      value={salesOrder.estimatedDeliveryDate || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {salesOrder.status === 'delivered' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Actual Delivery Date
                      </label>
                      <input
                        type="date"
                        name="actualDeliveryDate"
                        value={salesOrder.actualDeliveryDate || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Addresses</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </label>
                    <textarea
                      name="shippingAddress"
                      value={salesOrder.shippingAddress || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Shipping address..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Building className="h-4 w-4" />
                      Billing Address
                    </label>
                    <textarea
                      name="billingAddress"
                      value={salesOrder.billingAddress || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Billing address..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Financial Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Financial Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tax (KES)
                      </label>
                      <input
                        type="number"
                        name="tax"
                        value={salesOrder.tax}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Shipping (KES)
                      </label>
                      <input
                        type="number"
                        name="shipping"
                        value={salesOrder.shipping}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Discount (KES)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={salesOrder.discount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Payment Terms
                    </label>
                    <div className="relative">
                      <select
                        name="paymentTerms"
                        value={salesOrder.paymentTerms || 'Net 30'}
                        onChange={handleChange}
                        className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {paymentTermsOptions.map(term => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">KES {salesOrder.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Total:</span>
                      <span className="text-lg font-bold text-blue-600">
                        KES {salesOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <textarea
                  name="notes"
                  value={salesOrder.notes || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Add notes or special instructions..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
            
            {salesOrder.lineItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No line items added. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3">Total</th>
                      <th className="py-2 px-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesOrder.lineItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleLineItemChange(index, 'productName', e.target.value)}
                            placeholder="Product name"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            placeholder="Description"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-3 text-sm font-medium">
                          KES {(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            aria-label="Remove item"
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
          </div>

          {/* Bottom Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              <X className="h-4 w-4 inline mr-1.5" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  {params.id === 'new' ? 'Create Order' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}