'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Mail,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { quoteService, Quote } from '@/services/quoteService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { invoiceService } from '@/services/invoiceService';

// Skeleton Components
const SkeletonStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`rounded-2xl p-6 shadow-lg border ${i === 5 ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white border-gray-200'} animate-pulse`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-4 w-24 ${i === 5 ? 'bg-blue-100' : 'bg-gray-200'} rounded mb-2`}></div>
            <div className={`h-8 w-16 ${i === 5 ? 'bg-white/50' : 'bg-gray-300'} rounded`}></div>
          </div>
          <div className={`p-3 rounded-xl ${i === 5 ? 'bg-white/20' : 'bg-gray-100'}`}>
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
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-24 bg-gray-300 rounded-full animate-pulse"></div>
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

export default function QuotesDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    draft: 0,
    totalAmount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const statusOptions = [
    { value: 'all', label: 'All Quotes', color: 'text-gray-600' },
    { value: 'draft', label: 'Draft', color: 'text-gray-500' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'approved', label: 'Approved', color: 'text-green-600' },
    { value: 'rejected', label: 'Rejected', color: 'text-red-600' },
  ];

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const quotesData = await quoteService.getAllQuotes();
      setQuotes(quotesData);
      updateStats(quotesData);
    } catch (error) {
      console.error('Error loading quotes:', error);
      showToast('Failed to load quotes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await quoteService.getQuoteStats();
      if (statsData) {
        setStats({
          total: statsData.total || 0,
          approved: statsData.byStatus?.approved || 0,
          pending: statsData.byStatus?.pending || 0,
          draft: statsData.byStatus?.draft || 0,
          totalAmount: statsData.totalAmount || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadQuotes(), loadStats()]);
      showToast('Quotes refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuotes();
    loadStats();
  }, [loadQuotes, loadStats]);

  const updateStats = (quotesData: Quote[]) => {
    const total = quotesData.length;
    const approved = quotesData.filter(q => q.status === 'approved').length;
    const pending = quotesData.filter(q => q.status === 'pending').length;
    const draft = quotesData.filter(q => q.status === 'draft').length;
    const totalAmount = quotesData.reduce((sum, q) => sum + q.totalAmount, 0);
    
    setStats({ total, approved, pending, draft, totalAmount });
  };

  const handleApprove = async (quoteId: string) => {
    try {
      await quoteService.approveQuote(quoteId);
      showToast('Quote approved successfully', 'success');
      loadQuotes();
    } catch (error) {
      console.error('Error approving quote:', error);
      showToast('Failed to approve quote', 'error');
    }
  };

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    try {
      await quoteService.deleteQuote(quoteId);
      showToast('Quote deleted successfully', 'success');
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
      loadStats();
    } catch (error) {
      console.error('Error deleting quote:', error);
      showToast('Failed to delete quote', 'error');
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'pending': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'draft': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleCreateInvoice = async (quoteId: string) => {
    try {
      const invoice = await invoiceService.createInvoiceFromQuote(quoteId);
      showToast('Invoice created successfully', 'success');
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('Failed to create invoice', 'error');
    }
  };

  const handleExportPDF = async (quoteId: string) => {
    try {
      const blob = await quoteService.exportQuoteToPDF(quoteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quoteId}.pdf`;
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

  const handleSendEmail = async (quoteId: string) => {
    const email = prompt('Enter recipient email:', 'customer@example.com');
    if (!email) return;
    
    try {
      await quoteService.sendQuoteEmail(quoteId, {
        to: email,
        subject: 'Quote Details',
        message: 'Please find attached quote details.'
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
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Quotes</h1>
              <p className="text-blue-100 text-sm">Create, manage, and track customer quotes</p>
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
              href="/quotes/create"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Quote</span>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Quotes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>+12% this month</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-green-200">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-200">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {quoteService.formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Conversion Rate</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <TrendingUp className="h-4 w-4" />
                    <span>+5.2% from last month</span>
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
                      placeholder="Search quotes by number or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
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
                      className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none"
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

            {/* Quotes Table - Scrollable */}
            <div className="p-6 flex-1 overflow-y-auto">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Quote Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
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
              ) : filteredQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                    <FileText className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No quotes found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try changing your search or filters' 
                      : 'Create your first quote to get started'}
                  </p>
                  <Link
                    href="/quotes/create"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Create New Quote
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Quote Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
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
                      {filteredQuotes.map((quote) => (
                        <tr 
                          key={quote.id} 
                          className="hover:bg-gray-50/50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${getStatusColor(quote.status)}`}>
                                {getStatusIcon(quote.status)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/quotes/${quote.id}`}
                                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                                  >
                                    {quote.quoteNumber}
                                  </Link>
                                </div>
                                {quote.notes && (
                                  <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                    {quote.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-lg font-bold text-gray-900">
                              {quoteService.formatCurrency(quote.totalAmount)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(quote.status)} text-white`}>
                              {getStatusIcon(quote.status)}
                              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900">
                                Created: {new Date(quote.createdAt).toLocaleDateString()}
                              </div>
                              {quote.validUntil && (
                                <div className="text-xs text-gray-600">
                                  Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/quotes/${quote.id}`}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              
                              {quote.status === 'pending' && (
                                <button
                                  onClick={() => handleApprove(quote.id)}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                  title="Approve Quote"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleCreateInvoice(quote.id)}
                                className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                                title="Create Invoice"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleExportPDF(quote.id)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                title="Export PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              
                              <Link
                                href={`/quotes/${quote.id}/edit`}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Quote"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              
                              <button
                                onClick={() => handleDelete(quote.id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Quote"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          {!statsLoading && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quote Status Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { _id: 'draft', count: stats.draft },
                  { _id: 'pending', count: stats.pending },
                  { _id: 'approved', count: stats.approved },
                  { _id: 'rejected', count: stats.total - stats.draft - stats.pending - stats.approved }
                ].map((status) => (
                  <div
                    key={status._id}
                    className="p-3 rounded-xl bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${
                        status._id === 'approved' ? 'bg-green-400' :
                        status._id === 'pending' ? 'bg-yellow-400' :
                        status._id === 'draft' ? 'bg-gray-400' :
                        'bg-red-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {status._id}
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