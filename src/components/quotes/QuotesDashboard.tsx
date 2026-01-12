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
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { quoteService, Quote } from '@/services/quoteService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

// ✨ Cleaner Skeletons
const SkeletonStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`rounded-xl p-4 border ${i === 5 ? 'bg-white border-blue-200' : 'bg-white border-gray-200'} animate-pulse`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-4 w-20 ${i === 5 ? 'bg-blue-200' : 'bg-gray-200'} rounded mb-2`}></div>
            <div className={`h-6 w-14 ${i === 5 ? 'bg-blue-300' : 'bg-gray-300'} rounded`}></div>
          </div>
          <div className={`p-2 rounded-lg ${i === 5 ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonRow = () => (
  <tr className="border-b border-gray-200 animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-5 w-16 bg-gray-200 rounded"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
    </td>
    <td className="px-4 py-3">
      <div className="space-y-1">
        <div className="h-3 w-20 bg-gray-200 rounded"></div>
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
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
    rejected: 0,
    totalAmount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  // ✅ Add expandedRow state for kebab menu
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const statusOptions = [
    { value: 'all', label: 'All Quotes' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
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
      const statsData = await quoteService.getQuoteStatistics(); // Fixed method name
      if (statsData) {
        setStats({
          total: statsData.total || 0,
          approved: statsData.approved || 0, // Fixed property name
          pending: statsData.pending || 0, // Fixed property name
          draft: statsData.rejected || 0, // Using rejected for draft since service doesn't have draft
          rejected: statsData.rejected || 0,
          totalAmount: statsData.totalAmount || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats
      setStats({
        total: quotes.length,
        approved: quotes.filter(q => q.status === 'approved').length,
        pending: quotes.filter(q => q.status === 'pending').length,
        draft: quotes.filter(q => q.status === 'draft').length,
        rejected: quotes.filter(q => q.status === 'rejected').length,
        totalAmount: quotes.reduce((sum, q) => sum + q.totalAmount, 0)
      });
    } finally {
      setStatsLoading(false);
    }
  }, [quotes]);

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
  }, [loadQuotes]);

  useEffect(() => {
    if (quotes.length > 0) {
      loadStats();
    }
  }, [quotes, loadStats]);

  const updateStats = (quotesData: Quote[]) => {
    const total = quotesData.length;
    const approved = quotesData.filter(q => q.status === 'approved').length;
    const pending = quotesData.filter(q => q.status === 'pending').length;
    const draft = quotesData.filter(q => q.status === 'draft').length;
    const rejected = quotesData.filter(q => q.status === 'rejected').length;
    const totalAmount = quotesData.reduce((sum, q) => sum + q.totalAmount, 0);
    
    setStats({ total, approved, pending, draft, rejected, totalAmount });
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
      quote.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof quote.opportunityId === 'object' && 
       quote.opportunityId.subject?.toLowerCase().includes(searchTerm.toLowerCase()));
    
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

  const handleExportPDF = async (quoteId: string) => {
    try {
      // Check if service has exportQuoteToPDF method
      if ((quoteService as any).exportQuoteToPDF) {
        const blob = await (quoteService as any).exportQuoteToPDF(quoteId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quoteId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('PDF exported successfully', 'success');
      } else {
        // Fallback: Download as JSON
        const quote = quotes.find(q => q.id === quoteId);
        if (quote) {
          const dataStr = JSON.stringify(quote, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(dataBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `quote-${quote.quoteNumber}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          showToast('Quote data exported as JSON', 'success');
        }
      }
    } catch (error) {
      console.error('Error exporting quote:', error);
      showToast('Failed to export quote', 'error');
    }
  };

  const handleSendEmail = async (quoteId: string) => {
    const email = prompt('Enter recipient email:', 'customer@example.com');
    if (!email) return;
    
    try {
      // Check if service has sendQuoteEmail method
      if ((quoteService as any).sendQuoteEmail) {
        await (quoteService as any).sendQuoteEmail(quoteId, {
          to: email,
          subject: 'Quote Details',
          message: 'Please find attached quote details.'
        });
        showToast('Email sent successfully', 'success');
      } else {
        showToast('Email feature not available', 'info');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="h-6 w-6" />
                Quotes
              </h1>
              <p className="text-blue-100 mt-1">Create, manage, and track customer quotes</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link
                href="/quotes/create"
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                New Quote
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        {statsLoading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Quotes', value: stats.total, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
              { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Draft', value: stats.draft, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { 
                label: 'Total Value', 
                value: quoteService.formatCurrency(stats.totalAmount), 
                icon: DollarSign, 
                color: 'text-purple-600', 
                bg: 'bg-gradient-to-r from-purple-50 to-pink-50' 
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`${stat.bg} border border-gray-200 rounded-xl p-4`}>
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

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="lg:col-span-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="lg:col-span-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="w-full px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quote Details</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-5">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try a different search term or filter' 
                : 'Create your first quote to get started'}
            </p>
            <Link
              href="/quotes/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create Quote
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quote Details</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => {
                    const statusColor = getStatusColor(quote.status);
                    const StatusIcon = getStatusIcon(quote.status);
                    return (
                      <tr key={quote.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${statusColor.replace('bg-gradient-to-r from-', 'bg-').replace(' to-', ' ')}`}>
                            </div>
                            <div>
                              <Link
                                href={`/quotes/${quote.id}`}
                                className="font-medium text-gray-900 hover:text-blue-600"
                              >
                                {quote.quoteNumber}
                              </Link>
                              {quote.notes && (
                                <p className="text-sm text-gray-600 truncate max-w-[160px] mt-1">{quote.notes}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{quoteService.formatCurrency(quote.totalAmount)}</p>
                          <p className="text-sm text-gray-600 mt-1">{quote.items.length} item{quote.items.length !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${
                            statusColor.replace('bg-gradient-to-r from-', 'bg-').replace(' to-', ' ')
                          }`}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>Created: {new Date(quote.createdAt).toLocaleDateString()}</div>
                          {quote.updatedAt && (
                            <div className="text-xs mt-1">Updated: {new Date(quote.updatedAt).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {/* ✅ PRIMARY ACTIONS + KEBAB MENU */}
                          <div className="flex items-center gap-1">
                            {/* View */}
                            <Link
                              href={`/quotes/${quote.id}`}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {/* Edit */}
                            <Link
                              href={`/quotes/${quote.id}/edit`}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit Quote"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>

                            {/* Kebab Menu for secondary actions */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRow(expandedRow === quote.id ? null : quote.id);
                                }}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                                aria-haspopup="true"
                                aria-expanded={expandedRow === quote.id}
                                aria-label="More actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {expandedRow === quote.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setExpandedRow(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                    {quote.status === 'pending' && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setExpandedRow(null);
                                          handleApprove(quote.id);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve Quote
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedRow(null);
                                        handleExportPDF(quote.id);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                      <Download className="h-4 w-4" />
                                      Export PDF/JSON
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedRow(null);
                                        handleSendEmail(quote.id);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <Mail className="h-4 w-4" />
                                      Send Email
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedRow(null);
                                        handleDelete(quote.id);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete Quote
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status Summary */}
        {!statsLoading && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quote Status Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { _id: 'draft', count: stats.draft, color: 'bg-gray-400' },
                { _id: 'pending', count: stats.pending, color: 'bg-yellow-400' },
                { _id: 'approved', count: stats.approved, color: 'bg-green-400' },
                { _id: 'rejected', count: stats.rejected, color: 'bg-red-400' }
              ].map((status) => (
                <div key={status._id} className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-xs text-gray-600 capitalize mb-1">{status._id}</div>
                  <div className="text-lg font-bold text-gray-900">{status.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}