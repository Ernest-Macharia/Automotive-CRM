'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Plus, Search, Filter, RefreshCw,
  Eye, Edit, Trash2, Tag, CheckCircle,
  AlertTriangle, User, AlertCircle, TrendingDown,
  Loader2, ChevronRight, ShoppingCart, Layers,
  Box, Wrench, Droplets, Settings, Shield,
  Truck, Gift, Info, XCircle, ArrowUpDown
} from 'lucide-react';
import { productService, Product, PRODUCT_CATEGORIES, PRODUCT_STATUS, createProductStatusChecker } from '@/services/productService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="border border-gray-200 rounded-xl bg-white animate-pulse overflow-hidden flex flex-col shadow-sm">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      
      <div className="h-3 w-full bg-gray-200 rounded mb-2"></div>
      <div className="h-3 w-3/4 bg-gray-200 rounded mb-3"></div>

      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
        <div className="h-6 w-12 bg-gray-200 rounded"></div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
      <div className="h-2 w-12 bg-gray-200 rounded"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export default function ProductsList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'discontinued', label: 'Discontinued', color: 'bg-red-100 text-red-800' },
    { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-gray-100 text-gray-800' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: Box },
    { value: 'parts', label: 'Parts', icon: Wrench },
    { value: 'tools', label: 'Tools', icon: Settings },
    { value: 'consumables', label: 'Consumables', icon: Droplets },
    { value: 'equipment', label: 'Equipment', icon: Truck },
    { value: 'accessories', label: 'Accessories', icon: Gift },
    { value: 'other', label: 'Other', icon: Package },
  ];

  const stockOptions = [
    { value: 'all', label: 'All Stock' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      let filteredProducts = response || [];
      
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      if (statusFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.status === statusFilter);
      }
      
      if (categoryFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
      }
      
      if (stockFilter !== 'all') {
        if (stockFilter === 'out_of_stock') {
          filteredProducts = filteredProducts.filter(product => product.quantityInStock <= 0);
        } else if (stockFilter === 'low_stock') {
          filteredProducts = filteredProducts.filter(product => 
            product.quantityInStock > 0 && product.quantityInStock <= product.reorderLevel
          );
        } else if (stockFilter === 'in_stock') {
          filteredProducts = filteredProducts.filter(product => product.quantityInStock > 0);
        }
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, categoryFilter, stockFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await productService.getProductStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchProducts(), fetchStats()]);
      showToast('Products refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will mark it as inactive.')) return;
    
    try {
      const result = await productService.deleteProduct(id);
      showToast(result.message || 'Product deleted successfully', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await productService.toggleProductStatus(id);
      showToast('Product status updated', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      showToast('Failed to update product status', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'parts': return <Wrench className="h-3.5 w-3.5" />;
      case 'tools': return <Settings className="h-3.5 w-3.5" />;
      case 'consumables': return <Droplets className="h-3.5 w-3.5" />;
      case 'equipment': return <Truck className="h-3.5 w-3.5" />;
      case 'accessories': return <Gift className="h-3.5 w-3.5" />;
      default: return <Package className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    return productService.getCategoryColor(category);
  };

  const getStatusColor = (status: string) => {
    return productService.getStatusColor(status);
  };

  const getStatusText = (status: string) => {
    return productService.getStatusText(status);
  };

  const getCategoryText = (category: string) => {
    return productService.getCategoryText(category);
  };

  const getStockColor = (product: Product) => {
    if (product.quantityInStock <= 0) return 'text-red-600 bg-red-50';
    if (product.quantityInStock <= product.reorderLevel) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockText = (product: Product) => {
    if (product.quantityInStock <= 0) return 'Out of Stock';
    if (product.quantityInStock <= product.reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleQuickStockUpdate = async (product: Product, operation: 'add' | 'remove') => {
    const amount = prompt(`Enter amount to ${operation}:`, '10');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast('Invalid amount', 'error');
      return;
    }
    
    try {
      await productService.updateStock(product._id, {
        quantity: Number(amount),
        operation: operation,
        reason: `Quick ${operation} via dashboard`
      });
      showToast(`Stock ${operation === 'add' ? 'added' : 'removed'} successfully`, 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      showToast('Failed to update stock', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header - Matching Services page style exactly */}
      <div className="h-16 flex items-center px-6 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Product Inventory</h1>
              <p className="text-blue-100 text-xs">Manage your product catalog and inventory</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-60"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/products/create"
              className="px-3 py-1.5 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Product</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl p-4 border bg-white border-gray-200 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Products', value: stats.total || 0, icon: Package, color: '#2563eb' }, // Changed to blue
              { label: 'Active', value: stats.active || 0, icon: CheckCircle, color: '#10b981' },
              { label: 'Out of Stock', value: stats.outOfStock || 0, icon: XCircle, color: '#ef4444' },
              { label: 'Low Stock', value: stats.lowStock || 0, icon: AlertTriangle, color: '#f59e0b' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-bold text-gray-800">{item.value}</p>
                  </div>
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Distribution */}
        {!statsLoading && stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Category Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(stats.byCategory).map(([category, count]) => {
                let bgColor = 'bg-blue-100 text-blue-800'; // Changed from green to blue
                let icon = Box;
                
                switch (category) {
                  case 'parts': 
                    bgColor = 'bg-orange-100 text-orange-800';
                    icon = Wrench;
                    break;
                  case 'tools': 
                    bgColor = 'bg-blue-100 text-blue-800';
                    icon = Settings;
                    break;
                  case 'consumables': 
                    bgColor = 'bg-purple-100 text-purple-800';
                    icon = Droplets;
                    break;
                  case 'equipment': 
                    bgColor = 'bg-indigo-100 text-indigo-800';
                    icon = Truck;
                    break;
                  case 'accessories': 
                    bgColor = 'bg-pink-100 text-pink-800';
                    icon = Gift;
                    break;
                }
                
                const Icon = icon;
                
                return (
                  <div key={category} className={`p-3 rounded-lg ${bgColor}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <div className="text-xs font-medium capitalize">
                        {category}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{count as number}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters & Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products by name, code, manufacturer, or tags..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Layers className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {stockOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <TrendingDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="p-4 md:p-5">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">No products found</h3>
                <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || stockFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Create your first product to add to your inventory.'}
                </p>
                <Link
                  href="/products/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Create New Product
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => {
                  const statusChecker = createProductStatusChecker(product);
                  return (
                    <div 
                      key={product._id} 
                      className="border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h3>
                            <p className="text-xs text-gray-500">{product.productCode}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
                              {getStatusText(product.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-600 text-xs line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        {/* Stock & Category */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`p-1.5 rounded ${getStockColor(product)}`}>
                              <ShoppingCart className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-medium">
                                {getStockText(product)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.quantityInStock} {product.unitOfMeasure}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(product.category)}`}>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(product.category)}
                              {getCategoryText(product.category)}
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {product.tags.slice(0, 2).map((tag, index) => (
                              <span 
                                key={index} 
                                className={`px-1.5 py-0.5 rounded text-xs ${getTagColor(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {product.tags.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                +{product.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="space-y-1.5 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{product.manufacturer}</span>
                          </div>
                          {product.modelNumber && (
                            <div className="flex items-center gap-1.5">
                              <Tag className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">Model: {product.modelNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">v{product.version}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100 group-hover:bg-gray-100 transition-colors">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleQuickStockUpdate(product, 'add')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title="Add Stock"
                          >
                            + Stock
                          </button>
                          <button
                            onClick={() => handleQuickStockUpdate(product, 'remove')}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Remove Stock"
                          >
                            - Stock
                          </button>
                        </div>
                        <div className="flex gap-1.5">
                          <Link
                            href={`/products/${product._id}`}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/products/${product._id}/edit`}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
