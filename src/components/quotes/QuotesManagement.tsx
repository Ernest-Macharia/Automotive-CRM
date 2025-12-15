'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Mail,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Building,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { quoteService, Quote, QuotesResponse } from '@/services/quoteService';
import CreateQuoteModal from './CreateQuoteModal';
import QuoteDetailModal from './QuoteDetailModal';

export default function QuotesManagement() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<any>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Quote | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  const statuses = ['draft', 'pending', 'approved', 'rejected', 'expired'];

  useEffect(() => {
    loadQuotes();
    loadStats();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await quoteService.getAllQuotes();
      setQuotes(response.data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      showToast('Failed to load quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await quoteService.getQuoteStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading quote stats:', error);
    }
  };

  const handleCreateQuote = async (data: any) => {
    try {
      const newQuote = await quoteService.createQuote(data);
      setQuotes(prev => [newQuote, ...prev]);
      showToast('Quote created successfully', 'success');
      setShowCreateModal(false);
      loadStats();
    } catch (error) {
      console.error('Error creating quote:', error);
      showToast('Failed to create quote', 'error');
    }
  };

  const handleApproveQuote = async (quote: Quote) => {
    try {
      const updatedQuote = await quoteService.approveQuote(quote.id);
      setQuotes(prev => prev.map(q => q.id === quote.id ? updatedQuote : q));
      showToast('Quote approved successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error approving quote:', error);
      showToast('Failed to approve quote', 'error');
    }
  };

  const handleDeleteQuote = async (quote: Quote) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    try {
      await quoteService.deleteQuote(quote.id);
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      showToast('Quote deleted successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error deleting quote:', error);
      showToast('Failed to delete quote', 'error');
    }
  };

  const handleExportPDF = async (quote: Quote) => {
    try {
      const blob = await quoteService.exportQuoteToPDF(quote.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote.quoteNumber}.pdf`;
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

  const handleSendEmail = async (quote: Quote) => {
    const email = prompt('Enter recipient email:', 'customer@example.com');
    if (!email) return;
    
    try {
      await quoteService.sendQuoteEmail(quote.id, {
        to: email,
        subject: `Quote ${quote.quoteNumber}`,
        message: `Please find attached quote ${quote.quoteNumber}`
      });
      showToast('Email sent successfully', 'success');
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email', 'error');
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
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Quotes Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create, manage, and track quotes
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow"
        >
          <Plus className="h-4 w-4" />
          New Quote
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Quotes</p>
              <p className="text-2xl font-bold text-blue-800">
                {stats?.total || 0}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-800">
                {stats?.byStatus?.approved || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">
                {stats?.byStatus?.pending || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-purple-800">
                {quoteService.formatCurrency(stats?.totalAmount || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
          
          <button
            onClick={loadQuotes}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No quotes found
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {quote.quoteNumber}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              Opportunity: {quote.opportunityId.substring(0, 8)}...
                            </div>
                            {quote.notes && (
                              <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                                {quote.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {quoteService.formatCurrency(quote.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(quote.status)}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </div>
                        {quote.validUntil && (
                          <div className="text-xs text-gray-500 mt-1">
                            Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDetailModal(quote)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {quote.status === 'pending' && (
                          <button
                            onClick={() => handleApproveQuote(quote)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Quote"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleExportPDF(quote)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Export PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleSendEmail(quote)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => router.push(`/quotes/${quote.id}/edit`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Quote"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteQuote(quote)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Quote"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateQuoteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateQuote}
      />
      
      {showDetailModal && (
        <QuoteDetailModal
          quote={showDetailModal}
          isOpen={!!showDetailModal}
          onClose={() => setShowDetailModal(null)}
          onExport={handleExportPDF}
          onSendEmail={handleSendEmail}
          onApprove={handleApproveQuote}
        />
      )}
    </div>
  );
}