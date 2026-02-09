'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Mail,
  Search,
  Filter,
  Eye,
  CreditCard,
  Trash2,
  TrendingUp,
  DollarSign,
  RefreshCw,
  FileText,
  Loader2,
  Calendar,
  Building,
  User
} from 'lucide-react';
import { invoiceService, Invoice, INVOICE_STATUS, PAYMENT_STATUS } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to calculate days until due
const daysUntilDue = (dueDate?: string): number => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export default function InvoicesDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    approved: 0,
    cancelled: 0,
    unpaid: 0,
    paid: 0,
    partiallyPaid: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const statusOptions = [
    { value: 'all', label: 'All Invoices', color: 'text-gray-600' },
    { value: INVOICE_STATUS.DRAFT, label: 'Draft', color: 'text-gray-500' },
    { value: INVOICE_STATUS.SENT, label: 'Sent', color: 'text-blue-600' },
    { value: INVOICE_STATUS.APPROVED, label: 'Approved', color: 'text-green-600' },
    { value: INVOICE_STATUS.CANCELLED, label: 'Cancelled', color: 'text-red-600' },
    { value: PAYMENT_STATUS.UNPAID, label: 'Unpaid', color: 'text-orange-600' },
    { value: PAYMENT_STATUS.PAID, label: 'Paid', color: 'text-green-600' },
    { value: PAYMENT_STATUS.PARTIALLY_PAID, label: 'Partially Paid', color: 'text-yellow-600' },
  ];

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const invoicesData = await invoiceService.getAllInvoices();
      setInvoices(invoicesData);
      calculateStats(invoicesData);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      console.error('Full error:', error.message, error.stack);
      showToast(`Failed to load invoices: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [showToast]);

  const calculateStats = (invoicesData: Invoice[]) => {
    let draft = 0;
    let sent = 0;
    let approved = 0;
    let cancelled = 0;
    let unpaid = 0;
    let paid = 0;
    let partiallyPaid = 0;
    let totalAmount = 0;
    let paidAmount = 0;
    
    invoicesData.forEach(invoice => {
      // Count by status
      switch (invoice.status) {
        case INVOICE_STATUS.DRAFT: draft++; break;
        case INVOICE_STATUS.SENT: sent++; break;
        case INVOICE_STATUS.APPROVED: approved++; break;
        case INVOICE_STATUS.CANCELLED: cancelled++; break;
      }
      
      // Count by payment status
      switch (invoice.paymentStatus) {
        case PAYMENT_STATUS.UNPAID: unpaid++; break;
        case PAYMENT_STATUS.PAID: paid++; break;
        case PAYMENT_STATUS.PARTIALLY_PAID: partiallyPaid++; break;
      }
      
      // Calculate amounts
      totalAmount += invoice.total || 0;
      
      if (invoice.paymentStatus === PAYMENT_STATUS.PAID) {
        paidAmount += invoice.total || 0;
      } else if (invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID) {
        // Assuming half paid for partially paid
        paidAmount += (invoice.total || 0) / 2;
      }
    });
    
    const outstandingAmount = totalAmount - paidAmount;
    const overdue = invoicesData.filter(invoice => 
      invoiceService.isOverdue(invoice) && invoice.paymentStatus !== PAYMENT_STATUS.PAID
    ).length;
    
    setStats({ 
      total: invoicesData.length,
      draft,
      sent,
      approved,
      cancelled,
      unpaid,
      paid,
      partiallyPaid,
      totalAmount,
      paidAmount,
      outstandingAmount
    });
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadInvoices();
      showToast('Invoices refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await invoiceService.deleteInvoice(invoiceId);
      showToast('Invoice deleted successfully', 'success');
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      calculateStats(invoices.filter(i => i.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showToast('Failed to delete invoice', 'error');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    // Check if filter is a status or paymentStatus
    const isStatusFilter = Object.values(INVOICE_STATUS).includes(filterStatus as any);
    const isPaymentStatusFilter = Object.values(PAYMENT_STATUS).includes(filterStatus as any);
    
    if (isStatusFilter) {
      return matchesSearch && invoice.status === filterStatus;
    } else if (isPaymentStatusFilter) {
      return matchesSearch && invoice.paymentStatus === filterStatus;
    }
    
    return matchesSearch;
  });

  const getStatusColor = (invoice: Invoice) => {
    if (invoiceService.isOverdue(invoice) && invoice.paymentStatus !== PAYMENT_STATUS.PAID) {
      return 'bg-gradient-to-r from-red-500 to-pink-500';
    }
    
    switch (invoice.status) {
      case INVOICE_STATUS.DRAFT: return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case INVOICE_STATUS.SENT: return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case INVOICE_STATUS.APPROVED: return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case INVOICE_STATUS.CANCELLED: return 'bg-gradient-to-r from-red-500 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case PAYMENT_STATUS.PAID: return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case PAYMENT_STATUS.PARTIALLY_PAID: return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case PAYMENT_STATUS.UNPAID: return 'bg-gradient-to-r from-orange-500 to-red-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (invoice: Invoice) => {
    if (invoiceService.isOverdue(invoice) && invoice.paymentStatus !== PAYMENT_STATUS.PAID) {
      return <AlertCircle className="h-4 w-4" />;
    }
    
    switch (invoice.status) {
      case INVOICE_STATUS.DRAFT: return <FileText className="h-4 w-4" />;
      case INVOICE_STATUS.SENT: return <Mail className="h-4 w-4" />;
      case INVOICE_STATUS.APPROVED: return <CheckCircle className="h-4 w-4" />;
      case INVOICE_STATUS.CANCELLED: return <AlertCircle className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const handleExportPDF = async (invoiceId: string) => {
    try {
      // This would need to be implemented in your invoiceService
      // For now, we'll show a toast message
      showToast('PDF export feature coming soon!', 'info');
      
      // Temporary: Download invoice details as text
      const invoice = invoices.find(i => i.id === invoiceId);
      if (invoice) {
        const invoiceText = `
Invoice Number: ${invoice.invoiceNumber}
Status: ${invoiceService.getStatusText(invoice.status)}
Payment Status: ${invoiceService.getPaymentStatusText(invoice.paymentStatus)}
Total: ${invoiceService.formatCurrency(invoice.total)}
Due Date: ${formatDate(invoice.dueDate)}
Created: ${formatDate(invoice.createdAt)}
        `.trim();
        
        const blob = new Blob([invoiceText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Failed to export invoice', 'error');
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    showToast('Email feature coming soon!', 'info');
  };

  const getOpportunityName = (invoice: Invoice): string => {
    if (typeof invoice.opportunityId === 'object') {
      return invoice.opportunityId.subject || invoice.opportunityId.companyName || 'Opportunity';
    }
    return 'Opportunity';
  };

  // Skeleton Components (keep as is)
  const SkeletonStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 mb-6 md:mb-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`rounded-xl p-4 md:p-6 shadow-sm border ${i === 6 ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white border-gray-200'} animate-pulse`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`h-3 w-20 ${i === 6 ? 'bg-blue-100' : 'bg-gray-200'} rounded mb-2`}></div>
              <div className={`h-6 w-16 ${i === 6 ? 'bg-white/50' : 'bg-gray-300'} rounded`}></div>
            </div>
            <div className={`p-2 md:p-3 rounded-lg ${i === 6 ? 'bg-white/20' : 'bg-gray-100'}`}>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const SkeletonRow = () => (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 md:h-10 md:w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div>
            <div className="h-3 w-20 bg-gray-300 rounded animate-pulse mb-1"></div>
            <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div className="space-y-1">
          <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
          <div className="h-2 w-14 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-2 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div className="space-y-1">
          <div className="h-6 w-24 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div className="space-y-1">
          <div className="h-3 w-20 bg-gray-300 rounded animate-pulse"></div>
          <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="h-14 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm flex items-center px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-1.5 md:p-2 bg-white/20 rounded-lg md:rounded-xl">
              <Receipt className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-semibold text-white">Invoices</h1>
              <p className="text-blue-100 text-xs md:text-sm hidden md:block">Create, manage, and track customer invoices</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-white animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-white" />
              )}
            </button>
            <Link
              href="/invoices/create"
              className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-blue-600 font-medium rounded-lg md:rounded-xl hover:bg-white/90 flex items-center gap-1.5 md:gap-2"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline text-xs md:text-sm">New Invoice</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Stats Cards */}
          {statsLoading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                { 
                  label: 'Total Invoices', 
                  value: stats.total, 
                  icon: Receipt, 
                  color: 'text-gray-600', 
                  bg: 'bg-gray-50' 
                },
                { 
                  label: 'Paid', 
                  value: stats.paid, 
                  icon: CheckCircle, 
                  color: 'text-green-600', 
                  bg: 'bg-green-50' 
                },
                { 
                  label: 'Outstanding', 
                  value: invoiceService.formatCurrency(stats.outstandingAmount), 
                  icon: DollarSign, 
                  color: 'text-yellow-600', 
                  bg: 'bg-yellow-50' 
                },
                { 
                  label: 'Unpaid', 
                  value: stats.unpaid, 
                  icon: Clock, 
                  color: 'text-blue-600', 
                  bg: 'bg-blue-50' 
                },
                { 
                  label: 'Overdue', 
                  value: invoices.filter(invoice => invoiceService.isOverdue(invoice)).length, 
                  icon: AlertCircle, 
                  color: 'text-red-600', 
                  bg: 'bg-red-50' 
                },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={i} 
                    className={`${stat.bg} border border-gray-200 rounded-xl p-4`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${stat.bg.includes('gradient') ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main Table Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filters - Fixed */}
            <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 flex-shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search invoices by number or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-9 md:pl-10 pr-8 py-2.5 md:py-3 bg-white border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none text-sm"
                      disabled={loading}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value} className={option.color}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                    className="px-3 py-2.5 md:px-4 md:py-3 text-gray-600 text-xs md:text-sm hover:text-gray-900 hover:bg-gray-100 rounded-lg md:rounded-xl transition-colors"
                    disabled={loading}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Invoices Table - Scrollable */}
            <div className="p-0 md:p-1">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Invoice Details
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-10 md:py-16">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 mb-4">
                    <Receipt className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">No invoices found</h3>
                  <p className="text-gray-500 text-sm md:text-base mb-6 max-w-md mx-auto">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try changing your search or filters' 
                      : 'Create your first invoice to get started'}
                  </p>
                  <Link
                    href="/invoices/create"
                    className="px-5 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 md:h-5 md:w-5" />
                    Create New Invoice
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Invoice Details
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredInvoices.map((invoice) => {
                        const isOverdue = invoiceService.isOverdue(invoice);
                        const daysUntilDueValue = daysUntilDue(invoice.dueDate);
                        const statusText = invoiceService.getStatusText(invoice.status);
                        const paymentStatusText = invoiceService.getPaymentStatusText(invoice.paymentStatus);
                        
                        return (
                          <tr 
                            key={invoice.id} 
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getStatusColor(invoice)}`}>
                                  {getStatusIcon(invoice)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={`/invoices/${invoice.id}`}
                                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                      {invoice.invoiceNumber}
                                    </Link>
                                    {invoice.quoteId && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        From Quote
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {getOpportunityName(invoice)}
                                  </div>
                                  {invoice.notes && (
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-xs">
                                      {invoice.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="space-y-1">
                                <div className="text-base md:text-lg font-bold text-gray-900">
                                  {invoiceService.formatCurrency(invoice.total || 0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Subtotal: {invoiceService.formatCurrency(invoice.subtotal || 0)}
                                </div>
                                {invoice.tax && invoice.tax > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Tax: {invoiceService.formatCurrency(invoice.tax)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice)} text-white`}>
                                    {getStatusIcon(invoice)}
                                    {statusText}
                                  </span>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)} text-white`}>
                                    {invoice.paymentStatus === PAYMENT_STATUS.PAID ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID ? (
                                      <Clock className="h-3 w-3" />
                                    ) : (
                                      <AlertCircle className="h-3 w-3" />
                                    )}
                                    {paymentStatusText}
                                  </span>
                                </div>
                                {!isOverdue && daysUntilDueValue > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Due in {daysUntilDueValue} day{daysUntilDueValue !== 1 ? 's' : ''}
                                  </div>
                                )}
                                {isOverdue && (
                                  <div className="text-xs text-red-600 font-medium">
                                    Overdue by {Math.abs(daysUntilDueValue)} day{Math.abs(daysUntilDueValue) !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="space-y-1">
                                <div className="text-sm text-gray-700">
                                  Created: {formatDate(invoice.createdAt)}
                                </div>
                                {invoice.dueDate && (
                                  <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                    Due: {formatDate(invoice.dueDate)}
                                  </div>
                                )}
                                {invoice.paidAt && (
                                  <div className="text-sm text-green-600">
                                    Paid: {formatDate(invoice.paidAt)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 md:px-6 md:py-4">
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/invoices/${invoice.id}`}
                                  className="p-1.5 md:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                
                                {invoice.paymentStatus !== PAYMENT_STATUS.PAID && (
                                  <Link
                                    href={`/invoices/${invoice.id}/pay`}
                                    className="p-1.5 md:p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Record Payment"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </Link>
                                )}
                                
                                <button
                                  onClick={() => handleExportPDF(invoice.id)}
                                  className="p-1.5 md:p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Download PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleSendEmail(invoice.id)}
                                  className="p-1.5 md:p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Send Email"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                                
                                {invoice.status === INVOICE_STATUS.DRAFT && (
                                  <Link
                                    href={`/invoices/${invoice.id}/edit`}
                                    className="p-1.5 md:p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Edit Invoice"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Link>
                                )}
                                
                                <button
                                  onClick={() => handleDelete(invoice.id)}
                                  className="p-1.5 md:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          {!statsLoading && (
            <div className="bg-gray-50 rounded-xl p-4 md:p-6">
              <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-3 md:mb-4">Invoice Status Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                {[
                  { _id: 'draft', count: stats.draft, color: 'bg-gray-400' },
                  { _id: 'sent', count: stats.sent, color: 'bg-blue-400' },
                  { _id: 'approved', count: stats.approved, color: 'bg-green-400' },
                  { _id: 'cancelled', count: stats.cancelled, color: 'bg-red-400' },
                  { _id: 'unpaid', count: stats.unpaid, color: 'bg-orange-400' },
                  { _id: 'paid', count: stats.paid, color: 'bg-green-400' },
                  { _id: 'partially_paid', count: stats.partiallyPaid, color: 'bg-yellow-400' },
                ].map((status) => (
                  <div
                    key={status._id}
                    className="p-2.5 rounded-lg bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${status.color}`} />
                      <span className="text-xs font-medium text-gray-700 capitalize">
                        {status._id.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-base font-bold text-gray-800">{status.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}