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
  Loader2
} from 'lucide-react';
import { invoiceService, Invoice } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// Skeleton Components
const SkeletonStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className={`rounded-2xl p-6 shadow-lg border ${i === 6 ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white border-gray-200'} animate-pulse`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-4 w-24 ${i === 6 ? 'bg-blue-100' : 'bg-gray-200'} rounded mb-2`}></div>
            <div className={`h-8 w-16 ${i === 6 ? 'bg-white/50' : 'bg-gray-300'} rounded`}></div>
          </div>
          <div className={`p-3 rounded-xl ${i === 6 ? 'bg-white/20' : 'bg-gray-100'}`}>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonRow = () => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
        <div>
          <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1">
        <div className="h-5 w-20 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1">
        <div className="h-8 w-28 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1">
        <div className="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </td>
  </tr>
);

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
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    outstanding: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const statusOptions = [
    { value: 'all', label: 'All Invoices', color: 'text-gray-600' },
    { value: 'draft', label: 'Draft', color: 'text-gray-500' },
    { value: 'pending', label: 'Pending', color: 'text-blue-600' },
    { value: 'partially_paid', label: 'Partially Paid', color: 'text-yellow-600' },
    { value: 'paid', label: 'Paid', color: 'text-green-600' },
    { value: 'overdue', label: 'Overdue', color: 'text-red-600' },
  ];

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading invoices...');
      const invoicesData = await invoiceService.getAllInvoices();
      console.log('Loaded invoices:', invoicesData);
      setInvoices(invoicesData);
      updateStats(invoicesData);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      console.error('Full error:', error.message, error.stack);
      showToast(`Failed to load invoices: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // const loadStats = useCallback(async () => {
  //   try {
  //     setStatsLoading(true);
  //     const statsData = await invoiceService ();
  //     if (statsData) {
  //       setStats({
  //         total: statsData.total || 0,
  //         paid: statsData.paid || 0,
  //         pending: statsData.pending || 0,
  //         overdue: statsData.overdue || 0,
  //         totalAmount: statsData.totalAmount || 0,
  //         outstanding: statsData.outstanding || 0
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error loading stats:', error);
  //   } finally {
  //     setStatsLoading(false);
  //   }
  // }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadInvoices()]);
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

  const updateStats = (invoicesData: Invoice[]) => {
    const total = invoicesData.length;
    const paid = invoicesData.filter(i => i.paymentStatus === 'paid').length;
    const pending = invoicesData.filter(i => i.paymentStatus === 'pending').length;
    const overdue = invoicesData.filter(i => 
      invoiceService.isOverdue(i.dueDate) && i.paymentStatus !== 'paid'
    ).length;
    const totalAmount = invoicesData.reduce((sum, i) => sum + i.totalAmount, 0);
    const outstanding = invoicesData.reduce((sum, i) => sum + i.balance, 0);
    
    setStats({ total, paid, pending, overdue, totalAmount, outstanding });
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await invoiceService.deleteInvoice(invoiceId);
      showToast('Invoice deleted successfully', 'success');
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showToast('Failed to delete invoice', 'error');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (invoice: Invoice) => {
    if (invoiceService.isOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid') {
      return 'bg-gradient-to-r from-red-500 to-pink-500';
    }
    
    switch (invoice.paymentStatus) {
      case 'paid': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'partially_paid': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'pending': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'draft': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500';
    }
  };

  const getStatusIcon = (invoice: Invoice) => {
    if (invoiceService.isOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid') {
      return <AlertCircle className="h-4 w-4" />;
    }
    
    switch (invoice.paymentStatus) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'partially_paid': return <Clock className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const handleExportPDF = async (invoiceId: string) => {
    try {
      const blob = await invoiceService.exportInvoiceToPDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Failed to export PDF', 'error');
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    const email = prompt('Enter recipient email:', 'customer@example.com');
    if (!email) return;
    
    try {
      await invoiceService.sendInvoiceEmail(invoiceId, {
        to: email,
        subject: 'Invoice Details',
        message: 'Please find attached invoice details.'
      });
      showToast('Email sent successfully', 'success');
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Invoices</h1>
              <p className="text-blue-100 text-sm">Create, manage, and track customer invoices</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-white" />
              )}
            </button>
            <Link
              href="/invoices/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Invoice</span>
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Invoices</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>+8% this month</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.paid}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-green-200">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Outstanding</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {invoiceService.formatCurrency(stats.outstanding)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-200">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pending}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-100 to-red-200">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Total Revenue</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {invoiceService.formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <TrendingUp className="h-4 w-4" />
                    <span>+15.3% from last month</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Filters - Fixed */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 flex-shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search invoices by number or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none appearance-none"
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
                    className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    disabled={loading}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Invoices Table - Scrollable */}
            <div className="p-6 flex-1 overflow-y-auto">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Invoice Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount & Balance
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                    <Receipt className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No invoices found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try changing your search or filters' 
                      : 'Create your first invoice to get started'}
                  </p>
                  <Link
                    href="/invoices/create"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Create New Invoice
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Invoice Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount & Balance
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredInvoices.map((invoice) => {
                        const isOverdue = invoiceService.isOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid';
                        const daysUntilDue = invoiceService.daysUntilDue(invoice.dueDate);
                        
                        return (
                          <tr 
                            key={invoice.id} 
                            className="hover:bg-gray-50/50 transition-all duration-200 group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${getStatusColor(invoice)}`}>
                                  {getStatusIcon(invoice)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={`/invoices/${invoice.id}`}
                                      className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                                    >
                                      {invoice.invoiceNumber}
                                    </Link>
                                    {invoice.quoteId && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        From Quote
                                      </span>
                                    )}
                                  </div>
                                  {invoice.notes && (
                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                      {invoice.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-lg font-bold text-gray-900">
                                  {invoiceService.formatCurrency(invoice.totalAmount)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Paid: {invoiceService.formatCurrency(invoice.paidAmount)}
                                </div>
                                {invoice.balance > 0 && (
                                  <div className="text-sm font-medium text-red-600">
                                    Balance: {invoiceService.formatCurrency(invoice.balance)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(invoice)} text-white`}>
                                  {getStatusIcon(invoice)}
                                  {invoice.paymentStatus.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                                {!isOverdue && daysUntilDue >= 0 && (
                                  <div className="text-xs text-gray-600">
                                    Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                                  </div>
                                )}
                                {isOverdue && (
                                  <div className="text-xs text-red-600">
                                    Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-sm text-gray-900">
                                  Issued: {invoiceService.formatDate(invoice.issueDate)}
                                </div>
                                <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                  Due: {invoiceService.formatDate(invoice.dueDate)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/invoices/${invoice.id}`}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                
                                {invoice.balance > 0 && (
                                  <Link
                                    href={`/invoices/${invoice.id}/pay`}
                                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                    title="Record Payment"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </Link>
                                )}
                                
                                <button
                                  onClick={() => handleExportPDF(invoice.id)}
                                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Download PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleSendEmail(invoice.id)}
                                  className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all"
                                  title="Send Email"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                                
                                <Link
                                  href={`/invoices/${invoice.id}/edit`}
                                  className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                                  title="Edit Invoice"
                                >
                                  <FileText className="h-4 w-4" />
                                </Link>
                                
                                <button
                                  onClick={() => handleDelete(invoice.id)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Invoice Status Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { _id: 'draft', count: invoices.filter(i => i.paymentStatus === 'draft').length },
                  { _id: 'pending', count: stats.pending },
                  { _id: 'partially_paid', count: invoices.filter(i => i.paymentStatus === 'partially_paid').length },
                  { _id: 'paid', count: stats.paid },
                  { _id: 'overdue', count: stats.overdue }
                ].map((status) => (
                  <div
                    key={status._id}
                    className="p-3 rounded-xl bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${
                        status._id === 'paid' ? 'bg-green-400' :
                        status._id === 'pending' ? 'bg-blue-400' :
                        status._id === 'partially_paid' ? 'bg-yellow-400' :
                        status._id === 'overdue' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {status._id.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">{status.count}</div>
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