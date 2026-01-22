'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, ChevronDown, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { useToast } from '@/contexts/ToastContext';
import { customerService, Customer } from '@/services/customersService';

interface CustomersFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedTier: string;
  setSelectedTier: (tier: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onClearFilters: () => void;
  currentCustomers?: Customer[];
  allCustomers?: Customer[];
}

export default function CustomersFilters({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedTier,
  setSelectedTier,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  showFilters,
  setShowFilters,
  onClearFilters,
  currentCustomers = [],
  allCustomers = []
}: CustomersFiltersProps) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const exportToExcel = async (exportAll: boolean = false) => {
    try {
      setExporting(true);
      setShowExportMenu(false);
      
      let dataToExport: Customer[];
      
      if (exportAll) {
        // Use the pre-filtered customers if available, otherwise fetch fresh data
        if (allCustomers && allCustomers.length > 0) {
          dataToExport = allCustomers;
        } else {
          // Fetch with current filters
          const filters = {
            search: searchTerm || undefined,
            type: selectedType !== 'all' ? selectedType : undefined,
            customerTier: selectedTier !== 'all' ? selectedTier : undefined,
            sort: `${sortBy}:${sortOrder}`
          };
          
          showToast('Fetching all filtered customers...', 'info');
          dataToExport = await customerService.getAllCustomers(filters);
        }
        
        if (dataToExport.length === 0) {
          showToast('No customers found to export', 'warning');
          return;
        }
        
        showToast(`Preparing ${dataToExport.length} customers for export...`, 'info');
      } else {
        // Export only current page view
        dataToExport = currentCustomers;
        if (dataToExport.length === 0) {
          showToast('No customers in current view to export', 'warning');
          return;
        }
      }

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AutoConnect CRM';
      workbook.created = new Date();

      // Add a worksheet
      const worksheet = workbook.addWorksheet('Customers');

      // Define columns with styling
      worksheet.columns = [
        { header: 'Customer ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Contact Person', key: 'contactPerson', width: 25 },
        { header: 'Customer Type', key: 'customerType', width: 12 },
        { header: 'Customer Tier', key: 'customerTier', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Total Spent (KES)', key: 'totalSpent', width: 18, style: { numFmt: '#,##0' } },
        { header: 'Total Orders', key: 'totalOrders', width: 12 },
        { header: 'Last Order Date', key: 'lastOrderDate', width: 15 },
        { header: 'Created Date', key: 'createdAt', width: 15 },
        { header: 'Vehicles Count', key: 'vehiclesCount', width: 10 },
        { header: 'Opportunities Count', key: 'opportunitiesCount', width: 15 },
        { header: 'Notes', key: 'notes', width: 40 }
      ];

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' } // Blue color
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Add data rows
      dataToExport.forEach(customer => {
        worksheet.addRow({
          id: customer._id,
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          company: customer.companyName || '',
          contactPerson: customer.contactPersonName || '',
          customerType: customer.type || '',
          customerTier: customer.customerTier || '',
          status: customer.status || 'active',
          totalSpent: customer.totalSpent || 0,
          totalOrders: customer.totalOrders || 0,
          lastOrderDate: formatDate(customer.lastOrderDate),
          createdAt: formatDate(customer.createdAt),
          vehiclesCount: customer.vehicles?.length || 0,
          opportunitiesCount: customer.opportunities?.length || 0,
          notes: customer.notes || ''
        });
      });

      // Apply alternating row colors and formatting
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Alternate row colors
          if (rowNumber % 2 === 0) {
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F8FAFC' } // Very light blue
            };
          }
          
          // Right align numeric columns
          const totalSpentCell = row.getCell('totalSpent');
          totalSpentCell.alignment = { horizontal: 'right' };
          
          const totalOrdersCell = row.getCell('totalOrders');
          totalOrdersCell.alignment = { horizontal: 'right' };
          
          const vehiclesCountCell = row.getCell('vehiclesCount');
          vehiclesCountCell.alignment = { horizontal: 'right' };
          
          const opportunitiesCountCell = row.getCell('opportunitiesCount');
          opportunitiesCountCell.alignment = { horizontal: 'right' };
          
          // Set vertical alignment for all cells
          row.alignment = { vertical: 'middle' };
          
          // Add borders to all cells
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.key) {
          let maxLength = column.header.length;
          worksheet.eachRow((row) => {
            const cell = row.getCell(column.key!);
            if (cell.value) {
              const cellLength = cell.value.toString().length;
              maxLength = Math.max(maxLength, cellLength);
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, column.width || 10), 50);
        }
      });

      // Add a summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      
      // Summary data
      const totalSpent = dataToExport.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);
      const totalOrders = dataToExport.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0);
      const totalVehicles = dataToExport.reduce((sum, customer) => sum + (customer.vehicles?.length || 0), 0);
      const totalOpportunities = dataToExport.reduce((sum, customer) => sum + (customer.opportunities?.length || 0), 0);
      
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 25 }
      ];
      
      summarySheet.addRows([
        { metric: 'Total Customers Exported', value: dataToExport.length },
        { metric: 'Total Amount Spent', value: formatCurrency(totalSpent) },
        { metric: 'Total Orders', value: totalOrders },
        { metric: 'Total Vehicles', value: totalVehicles },
        { metric: 'Total Opportunities', value: totalOpportunities },
        { metric: 'Export Date', value: new Date().toLocaleString() },
        { metric: 'Filters Applied', value: getFiltersDescription() }
      ]);

      // Style summary sheet
      const summaryHeader = summarySheet.getRow(1);
      summaryHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
      summaryHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '059669' } // Green color
      };
      summaryHeader.alignment = { vertical: 'middle', horizontal: 'center' };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Create blob and download
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `customers_export_${timestamp}.xlsx`;
      saveAs(blob, filename);
      
      showToast(
        `Successfully exported ${dataToExport.length} customers to Excel`,
        'success'
      );
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('Failed to export customers. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const getFiltersDescription = () => {
    const filters = [];
    
    if (searchTerm) filters.push(`Search: "${searchTerm}"`);
    if (selectedType !== 'all') filters.push(`Type: ${selectedType}`);
    if (selectedTier !== 'all') filters.push(`Tier: ${selectedTier}`);
    if (sortBy !== 'name') filters.push(`Sorted by: ${sortBy} ${sortOrder}`);
    
    return filters.length > 0 ? filters.join(', ') : 'None';
  };

  const handleExportClick = () => {
    if (currentCustomers.length === 0 && (!allCustomers || allCustomers.length === 0)) {
      showToast('No customers available to export', 'warning');
      return;
    }
    setShowExportMenu(!showExportMenu);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          
          {/* Export button with dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={handleExportClick}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
            
            {showExportMenu && !exporting && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
                  Export Options
                </div>
                <button
                  onClick={() => exportToExcel(false)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors flex justify-between items-center"
                >
                  <span>Current View</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {currentCustomers.length} rows
                  </span>
                </button>
                <button
                  onClick={() => exportToExcel(true)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors flex justify-between items-center"
                >
                  <span>All Filtered</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {allCustomers?.length || 'All'} rows
                  </span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-3 py-2 text-xs text-gray-500">
                  Includes Excel formatting with filters summary
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Tiers</option>
                <option value="vip">VIP</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
                <option value="standard">Standard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="name">Name</option>
                <option value="totalSpent">Total Spent</option>
                <option value="totalOrders">Total Orders</option>
                <option value="lastOrder">Last Order</option>
                <option value="type">Type</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end items-center gap-3">
            <div className="text-sm text-gray-500">
              {getFiltersDescription()}
            </div>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}