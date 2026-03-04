import { apiClient } from '@/lib/api/client';

export interface UserRef {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
}

export interface Specification {
  key: string;
  value: string;
  unit?: string;
}

export interface Product {
  _id: string;
  id: string;
  productCode: string;
  name: string;
  description: string;
  detailedDescription?: string;
  category: 'parts' | 'tools' | 'consumables' | 'equipment' | 'accessories' | 'other';
  tags: string[];
  manufacturer: string;
  modelNumber?: string;
  sku?: string;
  quantityInStock: number;
  reorderLevel: number;
  unitOfMeasure: string;
  compatibleWith: string[];
  specifications?: Specification[];
  supplierId?: string;
  supplier?: UserRef;
  storageRequirements?: string;
  warrantyPeriod?: string;
  safetyWarnings: string[];
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  isActive: boolean;
  internalNotes?: string;
  version: number;
  createdBy: UserRef;
  createdAt: string;
  updatedAt: string;
  lastRestocked?: string;
  lastSold?: string;
}

export interface CreateProductData {
  productCode?: string;
  name: string;
  description: string;
  detailedDescription?: string;
  category: 'parts' | 'tools' | 'consumables' | 'equipment' | 'accessories' | 'other';
  tags?: string[];
  manufacturer: string;
  modelNumber?: string;
  sku?: string;
  quantityInStock?: number;
  reorderLevel?: number;
  unitOfMeasure?: string;
  compatibleWith?: string[];
  specifications?: Specification[];
  supplierId?: string;
  storageRequirements?: string;
  warrantyPeriod?: string;
  safetyWarnings?: string[];
  internalNotes?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  detailedDescription?: string;
  category?: 'parts' | 'tools' | 'consumables' | 'equipment' | 'accessories' | 'other';
  tags?: string[];
  manufacturer?: string;
  modelNumber?: string;
  sku?: string;
  quantityInStock?: number;
  reorderLevel?: number;
  unitOfMeasure?: string;
  compatibleWith?: string[];
  specifications?: Specification[];
  supplierId?: string;
  storageRequirements?: string;
  warrantyPeriod?: string;
  safetyWarnings?: string[];
  status?: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  isActive?: boolean;
  internalNotes?: string;
}

export interface StockUpdateData {
  quantity: number;
  operation: 'add' | 'remove' | 'set';
  reason: string;
}

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  manufacturer?: string;
  tags?: string;
  lowStock?: boolean;
  search?: string;
  sort?: string;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  discontinued: number;
  outOfStock: number;
  lowStock: number;
  byCategory: Record<string, number>;
  byManufacturer: Record<string, number>;
  totalValue?: number;
  stockValueByCategory?: Record<string, number>;
}

class ProductService {
  /**
   * Create a new product
   * POST /api/v1/products
   */
  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      const response = await apiClient.post<CreateProductData, any>('/products', data);
      
      if (response.success && response.data) {
        return this.normalizeProduct(response.data);
      } else if (response._id || response.id) {
        return this.normalizeProduct(response);
      } else {
        console.error('Product creation response missing ID:', response);
        throw new Error('Product creation failed: No ID returned');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Get all products
   * GET /api/v1/products
   */
  async getAllProducts(params?: ProductFilterParams): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'lowStock' && typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (value !== '') {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any[]>(endpoint);
      
      let productsData: any[] = [];
      
      if (Array.isArray(response)) {
        productsData = response;
      } else {
        return [];
      }
      
      return productsData.map(product => this.normalizeProduct(product));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get a product by ID
   * GET /api/v1/products/{id}
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await apiClient.get<any>(`/products/${id}`);
      
      let productData = response;
      if (response.success && response.data) {
        productData = response.data;
      }
      
      return this.normalizeProduct(productData);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a product by product code
   * GET /api/v1/products/code/{productCode}
   */
  async getProductByCode(productCode: string): Promise<Product> {
    try {
      const response = await apiClient.get<any>(`/products/code/${productCode}`);
      
      let productData = response;
      if (response.success && response.data) {
        productData = response.data;
      }
      
      return this.normalizeProduct(productData);
    } catch (error) {
      console.error(`Error fetching product with code ${productCode}:`, error);
      throw error;
    }
  }

  /**
   * Search products
   * GET /api/v1/products/search
   */
  async searchProducts(query: string, params?: { category?: string; manufacturer?: string; inStock?: boolean }): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'inStock' && typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (value) {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      const endpoint = `/products/search?${queryParams.toString()}`;
      const response = await apiClient.get<any[]>(endpoint);
      
      let productsData: any[] = [];
      
      if (Array.isArray(response)) {
        productsData = response;
      } else {
        return [];
      }
      
      return productsData.map(product => this.normalizeProduct(product));
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Update a product
   * PATCH /api/v1/products/{id}
   */
  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    try {
      const response = await apiClient.patch<UpdateProductData, any>(`/products/${id}`, data);
      
      if (response.success && response.data) {
        return this.normalizeProduct(response.data);
      } else {
        return this.normalizeProduct(response);
      }
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product (soft delete)
   * DELETE /api/v1/products/{id}
   */
  async deleteProduct(id: string): Promise<{ message: string; productCode: string; name: string }> {
    try {
      const response = await apiClient.delete<{ message: string; productCode: string; name: string }>(`/products/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update product stock
   * POST /api/v1/products/{id}/stock
   */
  async updateStock(id: string, data: StockUpdateData): Promise<{ 
    success: boolean; 
    product: Product; 
    previousQuantity: number; 
    newQuantity: number; 
    operation: string;
    timestamp: string;
  }> {
    try {
      const response = await apiClient.post<StockUpdateData, any>(`/products/${id}/stock`, data);
      return response;
    } catch (error) {
      console.error(`Error updating stock for product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get product statistics
   * GET /api/v1/products/stats/summary
   */
  async getProductStatistics(): Promise<ProductStats> {
    try {
      const response = await apiClient.get<any>('/products/stats/summary');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Fallback: Calculate manually
      const products = await this.getAllProducts();
      
      const byCategory: Record<string, number> = {};
      const byManufacturer: Record<string, number> = {};
      
      let active = 0;
      let inactive = 0;
      let discontinued = 0;
      let outOfStock = 0;
      let lowStock = 0;
      
      products.forEach(product => {
        // Count by status
        if (product.status === 'active') active++;
        else if (product.status === 'inactive') inactive++;
        else if (product.status === 'discontinued') discontinued++;
        else if (product.status === 'out_of_stock') outOfStock++;
        
        // Count low stock items
        if (product.quantityInStock <= product.reorderLevel) {
          lowStock++;
        }
        
        // Count by category
        byCategory[product.category] = (byCategory[product.category] || 0) + 1;
        
        // Count by manufacturer
        byManufacturer[product.manufacturer] = (byManufacturer[product.manufacturer] || 0) + 1;
      });
      
      return {
        total: products.length,
        active,
        inactive,
        discontinued,
        outOfStock,
        lowStock,
        byCategory,
        byManufacturer,
      };
    } catch (error) {
      console.error('Error fetching product statistics:', error);
      throw error;
    }
  }

  /**
   * Normalize product data from backend
   */
  private normalizeProduct(data: any): Product {
    let productData = data;
    if (data.data && (data.data._id || data.data.id)) {
      productData = data.data;
    }
    
    const id = productData._id || productData.id;
    
    if (!id) {
      console.error('❌ Cannot find ID in product data:', productData);
      throw new Error('Product data missing ID');
    }
    
    // Extract createdBy
    let createdBy: UserRef = {
      _id: '',
      id: '',
      email: '',
      name: ''
    };
    
    if (typeof productData.createdBy === 'string') {
      createdBy._id = productData.createdBy;
      createdBy.id = productData.createdBy;
    } else if (productData.createdBy?._id) {
      createdBy = {
        _id: productData.createdBy._id,
        id: productData.createdBy._id,
        firstName: productData.createdBy.firstName,
        lastName: productData.createdBy.lastName,
        email: productData.createdBy.email || '',
        name: productData.createdBy.name || 
              (productData.createdBy.firstName && productData.createdBy.lastName 
                ? `${productData.createdBy.firstName} ${productData.createdBy.lastName}` 
                : productData.createdBy.email || 'Unknown')
      };
    }
    
    // Extract supplier if present
    let supplier: UserRef | undefined;
    if (productData.supplierId) {
      supplier = {
        _id: productData.supplierId,
        id: productData.supplierId,
        name: productData.supplier?.name || 'Unknown Supplier'
      };
    } else if (productData.supplier) {
      supplier = {
        _id: productData.supplier._id,
        id: productData.supplier._id,
        name: productData.supplier.name || 'Unknown Supplier'
      };
    }
    
    return {
      _id: id,
      id: id,
      productCode: productData.productCode || `PROD-${id.slice(-6).toUpperCase()}`,
      name: productData.name || 'Unnamed Product',
      description: productData.description || '',
      detailedDescription: productData.detailedDescription,
      category: productData.category || 'other',
      tags: productData.tags || [],
      manufacturer: productData.manufacturer || 'Unknown',
      modelNumber: productData.modelNumber,
      sku: productData.sku,
      quantityInStock: productData.quantityInStock || 0,
      reorderLevel: productData.reorderLevel || 5,
      unitOfMeasure: productData.unitOfMeasure || 'unit',
      compatibleWith: productData.compatibleWith || [],
      specifications: productData.specifications || [],
      supplierId: productData.supplierId,
      supplier: supplier,
      storageRequirements: productData.storageRequirements,
      warrantyPeriod: productData.warrantyPeriod,
      safetyWarnings: productData.safetyWarnings || [],
      status: productData.status || (productData.isActive === false ? 'inactive' : productData.quantityInStock <= 0 ? 'out_of_stock' : 'active'),
      isActive: productData.isActive !== false,
      internalNotes: productData.internalNotes,
      version: productData.version || 1,
      createdBy: createdBy,
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt || productData.createdAt,
      lastRestocked: productData.lastRestocked,
      lastSold: productData.lastSold,
    };
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const products = await this.getAllProducts({ category });
      return products.filter(product => product.category === category);
    } catch (error) {
      console.error(`Error fetching products with category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get products by manufacturer
   */
  async getProductsByManufacturer(manufacturer: string): Promise<Product[]> {
    try {
      const products = await this.getAllProducts({ manufacturer });
      return products.filter(product => product.manufacturer === manufacturer);
    } catch (error) {
      console.error(`Error fetching products by manufacturer ${manufacturer}:`, error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<Product[]> {
    try {
      const products = await this.getAllProducts();
      return products.filter(product => 
        product.quantityInStock <= product.reorderLevel && 
        product.status !== 'discontinued'
      );
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(): Promise<Product[]> {
    try {
      const products = await this.getAllProducts();
      return products.filter(product => product.quantityInStock <= 0);
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      throw error;
    }
  }

  /**
   * Get active products only
   */
  async getActiveProducts(): Promise<Product[]> {
    try {
      const products = await this.getAllProducts();
      return products.filter(product => product.isActive);
    } catch (error) {
      console.error('Error fetching active products:', error);
      throw error;
    }
  }

  /**
   * Search products by name, code, manufacturer, or description
   */
  async searchProductsByNameOrCode(searchTerm: string): Promise<Product[]> {
    try {
      const products = await this.getAllProducts();
      const term = searchTerm.toLowerCase();
      return products.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.productCode.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.manufacturer.toLowerCase().includes(term) ||
        product.tags.some(tag => tag.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get product category color for UI
   */
  getCategoryColor(category: string): string {
    switch (category?.toLowerCase()) {
      case 'parts': return 'warning';
      case 'tools': return 'primary';
      case 'consumables': return 'info';
      case 'equipment': return 'success';
      case 'accessories': return 'secondary';
      case 'other': return 'default';
      default: return 'default';
    }
  }

  /**
   * Get product category text for UI
   */
  getCategoryText(category: string): string {
    switch (category?.toLowerCase()) {
      case 'parts': return 'Parts';
      case 'tools': return 'Tools';
      case 'consumables': return 'Consumables';
      case 'equipment': return 'Equipment';
      case 'accessories': return 'Accessories';
      case 'other': return 'Other';
      default: return category || 'Unknown';
    }
  }

  /**
   * Get product status color for UI
   */
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'discontinued': return 'error';
      case 'out_of_stock': return 'error';
      default: return 'default';
    }
  }

  /**
   * Get product status text for UI
   */
  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'discontinued': return 'Discontinued';
      case 'out_of_stock': return 'Out of Stock';
      default: return status || 'Unknown';
    }
  }

  /**
   * Get product status icon
   */
  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return '✅';
      case 'inactive': return '⏸️';
      case 'discontinued': return '❌';
      case 'out_of_stock': return '🚫';
      default: return '📦';
    }
  }

  /**
   * Get stock status color
   */
  getStockStatusColor(product: Product): string {
    if (product.quantityInStock <= 0) return 'error';
    if (product.quantityInStock <= product.reorderLevel) return 'warning';
    return 'success';
  }

  /**
   * Get stock status text
   */
  getStockStatusText(product: Product): string {
    if (product.quantityInStock <= 0) return 'Out of Stock';
    if (product.quantityInStock <= product.reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  /**
   * Format product for select dropdown
   */
  formatProductForSelect(product: Product): { value: string; label: string; data?: Product } {
    return {
      value: product.id,
      label: `${product.productCode} - ${product.name} (${product.quantityInStock} in stock)`,
      data: product
    };
  }

  /**
   * Get products for select dropdown
   */
  async getProductsForSelect(): Promise<Array<{ value: string; label: string; data?: Product }>> {
    try {
      const products = await this.getActiveProducts();
      return products.map(product => this.formatProductForSelect(product));
    } catch (error) {
      console.error('Error getting products for select:', error);
      throw error;
    }
  }

  /**
   * Get in-stock products for select dropdown
   */
  async getInStockProductsForSelect(): Promise<Array<{ value: string; label: string; data?: Product }>> {
    try {
      const products = await this.getActiveProducts();
      const inStockProducts = products.filter(product => product.quantityInStock > 0);
      return inStockProducts.map(product => this.formatProductForSelect(product));
    } catch (error) {
      console.error('Error getting in-stock products for select:', error);
      throw error;
    }
  }

  /**
   * Update product status (wrapper for updateProduct)
   */
  async updateProductStatus(id: string, status: string): Promise<Product> {
    return this.updateProduct(id, { 
      status: status as any,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined
    });
  }

  /**
   * Toggle product active status
   */
  async toggleProductStatus(id: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      const newStatus = product.isActive ? 'inactive' : 'active';
      return this.updateProductStatus(id, newStatus);
    } catch (error) {
      console.error(`Error toggling product ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Add tag to product
   */
  async addProductTag(id: string, tag: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      const tags = [...new Set([...product.tags, tag])];
      return this.updateProduct(id, { tags });
    } catch (error) {
      console.error(`Error adding tag to product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove tag from product
   */
  async removeProductTag(id: string, tag: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      const tags = product.tags.filter(t => t !== tag);
      return this.updateProduct(id, { tags });
    } catch (error) {
      console.error(`Error removing tag from product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add safety warning to product
   */
  async addSafetyWarning(id: string, warning: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      const safetyWarnings = [...new Set([...(product.safetyWarnings || []), warning])];
      return this.updateProduct(id, { safetyWarnings });
    } catch (error) {
      console.error(`Error adding safety warning to product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove safety warning from product
   */
  async removeSafetyWarning(id: string, warning: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      const safetyWarnings = product.safetyWarnings.filter(w => w !== warning);
      return this.updateProduct(id, { safetyWarnings });
    } catch (error) {
      console.error(`Error removing safety warning from product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add compatibility to product
   */
  async addCompatibility(id: string, compatibleItem: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      const compatibleWith = [...new Set([...(product.compatibleWith || []), compatibleItem])];
      return this.updateProduct(id, { compatibleWith });
    } catch (error) {
      console.error(`Error adding compatibility to product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove compatibility from product
   */
  async removeCompatibility(id: string, compatibleItem: string): Promise<Product> {
    try {
      const product = await this.getProductById(id);
      const compatibleWith = product.compatibleWith.filter(item => item !== compatibleItem);
      return this.updateProduct(id, { compatibleWith });
    } catch (error) {
      console.error(`Error removing compatibility from product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Validate product data
   */
  validateProductData(data: CreateProductData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.name?.trim()) {
      errors.push('Product name is required');
    }
    
    if (!data.description?.trim()) {
      errors.push('Description is required');
    }
    
    if (!data.category) {
      errors.push('Product category is required');
    }
    
    if (!data.manufacturer?.trim()) {
      errors.push('Manufacturer is required');
    }
    
    if (data.quantityInStock !== undefined && data.quantityInStock < 0) {
      errors.push('Quantity cannot be negative');
    }
    
    if (data.reorderLevel !== undefined && data.reorderLevel < 0) {
      errors.push('Reorder level cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const productService = new ProductService();

// Product constants
export const PRODUCT_CATEGORIES = {
  PARTS: 'parts',
  TOOLS: 'tools',
  CONSUMABLES: 'consumables',
  EQUIPMENT: 'equipment',
  ACCESSORIES: 'accessories',
  OTHER: 'other',
};

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
  OUT_OF_STOCK: 'out_of_stock',
};

export const UNIT_OF_MEASURE = {
  UNIT: 'unit',
  LITER: 'liter',
  KILOGRAM: 'kilogram',
  METER: 'meter',
  SET: 'set',
  PAIR: 'pair',
  BOX: 'box',
  PACK: 'pack',
  ROLL: 'roll',
  CAN: 'can',
  BOTTLE: 'bottle',
  TUBE: 'tube',
};

// Helper function to create a product status checker
export const createProductStatusChecker = (product: Product) => {
  return {
    isActive: () => product.status === PRODUCT_STATUS.ACTIVE,
    isInactive: () => product.status === PRODUCT_STATUS.INACTIVE,
    isDiscontinued: () => product.status === PRODUCT_STATUS.DISCONTINUED,
    isOutOfStock: () => product.status === PRODUCT_STATUS.OUT_OF_STOCK || product.quantityInStock <= 0,
    isLowStock: () => product.quantityInStock <= product.reorderLevel && product.quantityInStock > 0,
    getStatusColor: () => productService.getStatusColor(product.status),
    getStatusText: () => productService.getStatusText(product.status),
    getStatusIcon: () => productService.getStatusIcon(product.status),
    getCategoryColor: () => productService.getCategoryColor(product.category),
    getCategoryText: () => productService.getCategoryText(product.category),
    getStockStatusColor: () => productService.getStockStatusColor(product),
    getStockStatusText: () => productService.getStockStatusText(product),
  };
};
