'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Package, ArrowLeft, Save, X, Loader2,
  Tag, AlertTriangle, FileText, Plus, Trash2,
  Wrench, Settings, Droplets, Truck, Gift, Box,
  Search, CheckCircle, ChevronDown, AlertCircle,
  ShoppingCart, Shield, Layers, Info, Eye, EyeOff
} from 'lucide-react';
import { 
  productService, 
  Product, 
  UpdateProductData, 
  PRODUCT_CATEGORIES, 
  UNIT_OF_MEASURE,
  Specification  // Import the Specification type from the service
} from '@/services/productService';
import { useToast } from '@/contexts/ToastContext';

interface ProductEditProps {
  productId: string;
}

// Remove the local Specification interface and use the imported one
// No need to redefine it

interface ProductFormData {
  name: string;
  description: string;
  detailedDescription: string;
  category: 'parts' | 'tools' | 'consumables' | 'equipment' | 'accessories' | 'other';
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  tags: string[];
  newTag: string;
  manufacturer: string;
  modelNumber: string;
  sku: string;
  quantityInStock: number;
  reorderLevel: number;
  unitOfMeasure: string;
  compatibleWith: string[];
  newCompatibleItem: string;
  specifications: Specification[];  // Use the imported type
  storageRequirements: string;
  warrantyPeriod: string;
  safetyWarnings: string[];
  newSafetyWarning: string;
  internalNotes: string;
}

export default function ProductEdit({ productId }: ProductEditProps) {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    detailedDescription: '',
    category: 'other',
    status: 'active',
    tags: [],
    newTag: '',
    manufacturer: '',
    modelNumber: '',
    sku: '',
    quantityInStock: 0,
    reorderLevel: 5,
    unitOfMeasure: 'unit',
    compatibleWith: [],
    newCompatibleItem: '',
    specifications: [],
    storageRequirements: '',
    warrantyPeriod: '',
    safetyWarnings: [],
    newSafetyWarning: '',
    internalNotes: ''
  });

  const categories = [
    { value: 'parts', label: 'Parts', icon: Wrench, color: 'bg-orange-100 text-orange-700' },
    { value: 'tools', label: 'Tools', icon: Settings, color: 'bg-blue-100 text-blue-700' },
    { value: 'consumables', label: 'Consumables', icon: Droplets, color: 'bg-purple-100 text-purple-700' },
    { value: 'equipment', label: 'Equipment', icon: Truck, color: 'bg-green-100 text-green-700' },
    { value: 'accessories', label: 'Accessories', icon: Gift, color: 'bg-pink-100 text-pink-700' },
    { value: 'other', label: 'Other', icon: Box, color: 'bg-gray-100 text-gray-700' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'inactive', label: 'Inactive', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'discontinued', label: 'Discontinued', icon: X, color: 'bg-red-100 text-red-700' },
    { value: 'out_of_stock', label: 'Out of Stock', icon: AlertTriangle, color: 'bg-gray-100 text-gray-700' },
  ];

  const unitOptions = [
    { value: 'unit', label: 'Unit' },
    { value: 'liter', label: 'Liter' },
    { value: 'kilogram', label: 'Kilogram' },
    { value: 'meter', label: 'Meter' },
    { value: 'set', label: 'Set' },
    { value: 'pair', label: 'Pair' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'roll', label: 'Roll' },
    { value: 'can', label: 'Can' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'tube', label: 'Tube' },
  ];

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const data = await productService.getProductById(id);
      setProduct(data);
      
      // Ensure specifications have proper structure
      const normalizedSpecs: Specification[] = (data.specifications || []).map((spec: any) => ({
        key: spec.key || '',
        value: spec.value || '',
        unit: spec.unit || ''
      }));
      
      setFormData({
        name: data.name,
        description: data.description,
        detailedDescription: data.detailedDescription || '',
        category: data.category,
        status: data.status,
        tags: data.tags || [],
        newTag: '',
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber || '',
        sku: data.sku || '',
        quantityInStock: data.quantityInStock,
        reorderLevel: data.reorderLevel,
        unitOfMeasure: data.unitOfMeasure,
        compatibleWith: data.compatibleWith || [],
        newCompatibleItem: '',
        specifications: normalizedSpecs,  // Use normalized specs
        storageRequirements: data.storageRequirements || '',
        warrantyPeriod: data.warrantyPeriod || '',
        safetyWarnings: data.safetyWarnings || [],
        newSafetyWarning: '',
        internalNotes: data.internalNotes || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('Failed to load product', 'error');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'category' || name === 'status') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as any 
      }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategorySelect = (category: ProductFormData['category']) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleStatusSelect = (status: ProductFormData['status']) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleAddTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddCompatibleItem = () => {
    if (formData.newCompatibleItem.trim()) {
      setFormData(prev => ({
        ...prev,
        compatibleWith: [...prev.compatibleWith, prev.newCompatibleItem.trim()],
        newCompatibleItem: ''
      }));
    }
  };

  const handleRemoveCompatibleItem = (itemToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      compatibleWith: prev.compatibleWith.filter(item => item !== itemToRemove)
    }));
  };

  const handleAddSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '', unit: '' }]
    }));
  };

  const handleUpdateSpecification = (index: number, field: keyof Specification, value: string) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
  };

  const handleRemoveSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const handleAddSafetyWarning = () => {
    if (formData.newSafetyWarning.trim()) {
      setFormData(prev => ({
        ...prev,
        safetyWarnings: [...prev.safetyWarnings, prev.newSafetyWarning.trim()],
        newSafetyWarning: ''
      }));
    }
  };

  const handleRemoveSafetyWarning = (warningToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      safetyWarnings: prev.safetyWarnings.filter(warning => warning !== warningToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Product name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.manufacturer.trim()) errors.push('Manufacturer is required');
    if (formData.quantityInStock < 0) errors.push('Quantity cannot be negative');
    if (formData.reorderLevel < 0) errors.push('Reorder level cannot be negative');
    
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
      setSaving(true);
      
      // Filter out empty specifications
      const validSpecifications = formData.specifications.filter(
        spec => spec.key.trim() !== '' && spec.value.trim() !== ''
      );
      
      const updateData: UpdateProductData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        detailedDescription: formData.detailedDescription.trim() || undefined,
        category: formData.category,
        status: formData.status,
        tags: formData.tags,
        manufacturer: formData.manufacturer.trim(),
        modelNumber: formData.modelNumber.trim() || undefined,
        sku: formData.sku.trim() || undefined,
        quantityInStock: formData.quantityInStock,
        reorderLevel: formData.reorderLevel,
        unitOfMeasure: formData.unitOfMeasure,
        compatibleWith: formData.compatibleWith,
        specifications: validSpecifications.length > 0 ? validSpecifications : undefined,
        storageRequirements: formData.storageRequirements.trim() || undefined,
        warrantyPeriod: formData.warrantyPeriod.trim() || undefined,
        safetyWarnings: formData.safetyWarnings,
        internalNotes: formData.internalNotes.trim() || undefined
      };
      
      await productService.updateProduct(productId, updateData);
      showToast('Product updated successfully!', 'success');
      router.push(`/products/${productId}`);
      
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Failed to update product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Product</h1>
                <p className="text-gray-200 text-sm">Editing: {product.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-white text-white font-semibold rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-6xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Code (Read-only)
                  </label>
                  <input
                    type="text"
                    value={product.productCode}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Product code cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Number
                  </label>
                  <input
                    type="text"
                    name="modelNumber"
                    value={formData.modelNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Product Category & Status */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Category */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Product Category *</h3>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => handleCategorySelect(category.value as any)}
                          className={`w-full px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                            formData.category === category.value
                              ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${category.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Product Status *</h3>
                  <div className="space-y-2">
                    {statusOptions.map((status) => {
                      const Icon = status.icon;
                      return (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => handleStatusSelect(status.value as any)}
                          className={`w-full px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                            formData.status === status.value
                              ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${status.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{status.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                Inventory Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity in Stock
                  </label>
                  <input
                    type="number"
                    name="quantityInStock"
                    value={formData.quantityInStock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock reaches this level</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit of Measure
                  </label>
                  <select
                    name="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  >
                    {unitOptions.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Disclaimer) *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors resize-none"
                required
              />
              <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  Include clear disclaimers about safety, hazards, and proper usage. Use the ⚠️ symbol for emphasis.
                </p>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description
              </label>
              <textarea
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none resize-none"
              />
            </div>

            {/* Specifications */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specifications
              </label>
              <div className="space-y-3">
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleUpdateSpecification(index, 'key', e.target.value)}
                      placeholder="Key (e.g., Weight)"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleUpdateSpecification(index, 'value', e.target.value)}
                      placeholder="Value (e.g., 2.5)"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    />
                    <input
                      type="text"
                      value={spec.unit || ''}
                      onChange={(e) => handleUpdateSpecification(index, 'unit', e.target.value)}
                      placeholder="Unit (e.g., kg)"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecification(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddSpecification}
                  className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  Add Specification
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={formData.newTag}
                  onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag (e.g., synthetic, quick-delivery)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-emerald-900"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <Tag className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No tags added</p>
                </div>
              )}
            </div>

            {/* Compatible With */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compatible With
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={formData.newCompatibleItem}
                  onChange={(e) => setFormData(prev => ({ ...prev, newCompatibleItem: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompatibleItem())}
                  placeholder="Add compatibility (e.g., Toyota Camry 2015-2020)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCompatibleItem}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.compatibleWith.length > 0 ? (
                <div className="space-y-2">
                  {formData.compatibleWith.map((item, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompatibleItem(item)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <Layers className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No compatibility information added.</p>
                </div>
              )}
            </div>

            {/* Safety Warnings */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Warnings
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={formData.newSafetyWarning}
                  onChange={(e) => setFormData(prev => ({ ...prev, newSafetyWarning: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSafetyWarning())}
                  placeholder="Add safety warning (e.g., Flammable, Keep away from heat)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSafetyWarning}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.safetyWarnings.length > 0 ? (
                <div className="space-y-2">
                  {formData.safetyWarnings.map((warning, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{warning}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSafetyWarning(warning)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <Shield className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No safety warnings added.</p>
                </div>
              )}
            </div>

            {/* Storage Requirements */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Requirements
              </label>
              <textarea
                name="storageRequirements"
                value={formData.storageRequirements}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none resize-none"
              />
            </div>

            {/* Warranty Period */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warranty Period
              </label>
              <input
                type="text"
                name="warrantyPeriod"
                value={formData.warrantyPeriod}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>

            {/* Internal Notes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes are only visible to your team, not to customers.
              </p>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
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
