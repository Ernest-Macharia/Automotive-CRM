'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, ArrowLeft, Edit, RefreshCw, Tag,
  Trash2, Loader2, Link, AlertTriangle,
  CheckCircle, XCircle, Wrench, Settings,
  Droplets, Truck, Gift, Box, Search,
  Copy, Eye, EyeOff, ShoppingCart, Shield,
  Layers, AlertCircle, Calendar, User,
  TrendingUp, TrendingDown, Save
} from 'lucide-react';
import { productService, Product, createProductStatusChecker, StockUpdateData } from '@/services/productService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface ProductDetailProps {
  productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [stockOperation, setStockOperation] = useState<'add' | 'remove' | 'set'>('add');
  const [stockAmount, setStockAmount] = useState<string>('10');
  const [stockReason, setStockReason] = useState<string>('');
  const [updatingStock, setUpdatingStock] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('Failed to load product details', 'error');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!product) return;
    
    try {
      setUpdating(true);
      const updatedProduct = await productService.toggleProductStatus(productId);
      setProduct(updatedProduct);
      showToast(`Product ${updatedProduct.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      console.error('Error toggling product status:', error);
      showToast('Failed to update product status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    if (!confirm(`Are you sure you want to delete "${product.name}"? This will mark it as inactive.`)) {
      return;
    }
    
    try {
      setUpdating(true);
      await productService.deleteProduct(productId);
      showToast('Product deleted successfully', 'success');
      router.push('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyCode = () => {
    if (product?.productCode) {
      navigator.clipboard.writeText(product.productCode);
      showToast('Product code copied to clipboard', 'success');
    }
  };

  const handleUpdateStock = async () => {
    if (!product || !stockAmount || isNaN(Number(stockAmount)) || Number(stockAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      setUpdatingStock(true);
      const data: StockUpdateData = {
        quantity: Number(stockAmount),
        operation: stockOperation,
        reason: stockReason || `Manual ${stockOperation} via dashboard`
      };

      await productService.updateStock(productId, data);
      showToast(`Stock ${stockOperation === 'add' ? 'added' : stockOperation === 'remove' ? 'removed' : 'set'} successfully`, 'success');
      
      // Refresh product data
      await fetchProduct();
      
      // Reset form
      setStockAmount('10');
      setStockReason('');
    } catch (error) {
      console.error('Error updating stock:', error);
      showToast('Failed to update stock', 'error');
    } finally {
      setUpdatingStock(false);
    }
  };

  const getCategoryIcon = () => {
    if (!product) return null;
    switch (product.category) {
      case 'parts': return <Wrench className="h-4 w-4" />;
      case 'tools': return <Settings className="h-4 w-4" />;
      case 'consumables': return <Droplets className="h-4 w-4" />;
      case 'equipment': return <Truck className="h-4 w-4" />;
      case 'accessories': return <Gift className="h-4 w-4" />;
      default: return <Box className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) return null;

  const statusChecker = createProductStatusChecker(product);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/products')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-white">{product.name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-emerald-100 text-sm">{product.productCode}</p>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-white/20 rounded text-white"
                  title="Copy product code"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProduct}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-white" />
            </button>

            <Link
              href={`/products/${product._id}/edit`}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <Edit className="h-5 w-5 text-white" />
            </Link>
            
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                product.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {updating ? '...' : product.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Product Overview</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      statusChecker.getStatusColor()
                    }`}>
                      {statusChecker.getStatusIcon()} {statusChecker.getStatusText()}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      statusChecker.getCategoryColor()
                    }`}>
                      {getCategoryIcon()} {statusChecker.getCategoryText()}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  v{product.version}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                  </div>
                </div>

                {product.detailedDescription && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Detailed Description</p>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-line">{product.detailedDescription}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-lg flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Internal Notes */}
                {product.internalNotes && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Internal Notes</p>
                      <button
                        onClick={() => setShowInternalNotes(!showInternalNotes)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                      >
                        {showInternalNotes ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Show
                          </>
                        )}
                      </button>
                    </div>
                    {showInternalNotes && (
                      <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{product.internalNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Specifications */}
                {product.specifications && product.specifications.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Specifications</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {product.specifications.map((spec, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-50 rounded border border-gray-100 text-sm"
                        >
                          <div className="font-medium text-gray-700">{spec.key}</div>
                          <div className="text-gray-600">
                            {spec.value} {spec.unit && <span className="text-gray-500">{spec.unit}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety Warnings */}
                {product.safetyWarnings && product.safetyWarnings.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Safety Warnings</p>
                    <div className="space-y-2">
                      {product.safetyWarnings.map((warning, index) => (
                        <div
                          key={index}
                          className="p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2"
                        >
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compatible With */}
                {product.compatibleWith && product.compatibleWith.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Compatible With</p>
                    <div className="space-y-1">
                      {product.compatibleWith.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-blue-50 rounded"
                        >
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                  href={`/products/${product._id}/edit`}
                  className="px-3 py-2 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                
                <button
                  onClick={handleToggleStatus}
                  disabled={updating}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center justify-center gap-1 ${
                    product.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {product.isActive ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Activate
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </button>
                
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Stock Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                Stock Management
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      statusChecker.getStockStatusColor()
                    }`}>
                      {statusChecker.getStockStatusText()}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {product.quantityInStock} {product.unitOfMeasure}
                  </div>
                  {product.reorderLevel > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Reorder level: {product.reorderLevel} {product.unitOfMeasure}
                    </p>
                  )}
                </div>

                {/* Stock Update Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Operation
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStockOperation('add')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                          stockOperation === 'add'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockOperation('remove')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                          stockOperation === 'remove'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <TrendingDown className="h-4 w-4 inline mr-1" />
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockOperation('set')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                          stockOperation === 'set'
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Edit className="h-4 w-4 inline mr-1" />
                        Set
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={stockAmount}
                      onChange={(e) => setStockAmount(e.target.value)}
                      min="1"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={stockReason}
                      onChange={(e) => setStockReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      placeholder="e.g., Restocked from supplier"
                    />
                  </div>

                  <button
                    onClick={handleUpdateStock}
                    disabled={updatingStock || !stockAmount || isNaN(Number(stockAmount))}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updatingStock ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Stock
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Product Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Product Code</p>
                  <p className="font-medium flex items-center gap-1">
                    {product.productCode}
                    <button
                      onClick={handleCopyCode}
                      className="p-0.5 hover:bg-gray-100 rounded"
                      title="Copy"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Manufacturer</p>
                  <p className="font-medium">{product.manufacturer}</p>
                </div>
                {product.modelNumber && (
                  <div>
                    <p className="text-xs text-gray-500">Model Number</p>
                    <p className="font-medium">{product.modelNumber}</p>
                  </div>
                )}
                {product.sku && (
                  <div>
                    <p className="text-xs text-gray-500">SKU</p>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Unit of Measure</p>
                  <p className="font-medium">{product.unitOfMeasure}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Version</p>
                  <p className="font-medium">v{product.version}</p>
                </div>
              </div>
            </div>

            {/* Storage & Warranty */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Storage & Warranty</h2>
              <div className="space-y-3 text-sm">
                {product.storageRequirements && (
                  <div>
                    <p className="text-xs text-gray-500">Storage Requirements</p>
                    <p className="text-gray-700 whitespace-pre-line">{product.storageRequirements}</p>
                  </div>
                )}
                {product.warrantyPeriod && (
                  <div>
                    <p className="text-xs text-gray-500">Warranty Period</p>
                    <p className="text-gray-700">{product.warrantyPeriod}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Created By */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Created By</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {product.createdBy.name?.charAt(0) || product.createdBy.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{product.createdBy.name || 'Unknown User'}</div>
                  <div className="text-sm text-gray-600">{product.createdBy.email || ''}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Timeline</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{formatDate(product.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{formatDate(product.updatedAt)}</span>
                </div>
                {product.lastRestocked && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Restocked:</span>
                    <span>{formatDate(product.lastRestocked)}</span>
                  </div>
                )}
                {product.lastSold && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sold:</span>
                    <span>{formatDate(product.lastSold)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
