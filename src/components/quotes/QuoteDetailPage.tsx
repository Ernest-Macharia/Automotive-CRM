'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  CheckCircle,
  Printer,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  DollarSign,
  User,
  Building,
  Calendar,
  Mail,
  Phone,
  Copy,
  Share2,
  MoreVertical,
  AlertCircle,
  Truck,
  RefreshCw,
  Eye,
  ExternalLink,
  History,
  MessageSquare,
  BarChart3,
  Package,
  CreditCard,
  TrendingUp,
  ChevronRight,
  FileSignature,
  ReceiptIcon,
  TruckIcon,
  PackageIcon,
  CreditCardIcon,
  Circle,
  CircleDot,
  CircleCheck,
  FileCheck,
  FileX,
  FilePlus,
  ChevronLeft,
  PlusCircle,
  MinusCircle,
  QrCode,
  Save,
  Upload,
  Eye as EyeIcon
} from 'lucide-react';
import { quoteService, Quote } from '@/services/quoteService';
import { invoiceService } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface QuoteDetailPageProps {
  id: string;
}

export default function QuoteDetailPage({ id }: QuoteDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (id) {
      loadQuote(id);
    }
  }, [id, refreshKey]);

  const loadQuote = async (id: string) => {
    try {
      setLoading(true);
      const data = await quoteService.getQuoteById(id);
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      showToast('Failed to load quote', 'error');
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSalesRepresentativeName = () => {
    if (!quote || typeof quote.opportunityId !== 'object') return 'Unassigned';

    const assignedTo = quote.opportunityId.assignedTo;
    if (!assignedTo) return 'Unassigned';

    if (typeof assignedTo === 'string') return assignedTo;

    return (
      assignedTo.name ||
      [assignedTo.firstName, assignedTo.lastName].filter(Boolean).join(' ').trim() ||
      assignedTo.email ||
      'Unassigned'
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      draft: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        icon: <FileText className="h-3 w-3" />
      },
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        icon: <Clock className="h-3 w-3" />
      },
      approved: { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      rejected: { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        icon: <XCircle className="h-3 w-3" />
      },
    };
    return config[status] || config.draft;
  };

  const renderOpportunity = (op: any) => {
    if (!op) return '-';
    if (typeof op === 'string') return op;
    return op.subject || op._id || '—';
  };

  const handleApprove = async () => {
    if (!quote) return;
    try {
      const approvedQuote = await quoteService.approveQuote(quote.id);
      setQuote(approvedQuote);
      showToast('Quote approved successfully', 'success');
    } catch {
      showToast('Failed to approve quote', 'error');
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      await quoteService.deleteQuote(quote.id);
      showToast('Quote deleted successfully', 'success');
      router.push('/quotes');
    } catch {
      showToast('Failed to delete quote', 'error');
    }
  };

  const handleExportPDF = async () => {
    if (!quote) return;
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
    } catch {
      showToast('Failed to export PDF', 'error');
    }
  };

  const handleCreateInvoice = async () => {
    if (!quote) return;
    try {
      const invoice = await invoiceService.createInvoiceFromQuote(quote.id);
      showToast('Invoice created successfully', 'success');
      router.push(`/invoices/${invoice.id}`);
    } catch {
      showToast('Failed to create invoice', 'error');
    }
  };

  const copyQuoteNumber = () => {
    if (quote?.quoteNumber) {
      navigator.clipboard.writeText(quote.quoteNumber);
      showToast('Quote number copied to clipboard', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
    showToast('Print dialog opened', 'info');
  };

  /* ---------------- loading states ---------------- */

  const SkeletonHeader = () => (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonContent = () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quote Not Found</h3>
          <p className="text-gray-600 mb-6">The quote you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/quotes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Quotes
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusBadge(quote.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Blue to Purple Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/quotes')}
                className="p-2.5 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                aria-label="Back to quotes"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{quote.quoteNumber}</h1>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.icon}
                      <span className="text-xs font-medium capitalize">{quote.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/90">Quote • Created {formatDate(quote.createdAt)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="p-2.5 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="Refresh"
                aria-label="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <Link
                href={`/quotes/${quote.id}/edit`}
                className="p-2.5 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="Edit"
                aria-label="Edit quote"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
              <button
                onClick={handleExportPDF}
                className="p-2.5 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="Export PDF"
                aria-label="Export PDF"
              >
                <Download className="h-5 w-5 text-white" />
              </button>
              <div className="relative" ref={actionsMenuRef}>
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2.5 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                  title="More actions"
                  aria-label="More actions"
                  aria-expanded={showActionsMenu}
                >
                  <MoreVertical className="h-5 w-5 text-white" />
                </button>
                
                {/* Actions Menu */}
                {showActionsMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 animate-fade-in">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</span>
                    </div>
                    
                    <button onClick={handlePrint} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full">
                      <Printer className="h-4 w-4" />
                      Print Quote
                    </button>
                    
                    <button onClick={copyQuoteNumber} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full">
                      <Copy className="h-4 w-4" />
                      Copy Quote Number
                    </button>
                    
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button onClick={handleDelete} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full">
                        <Trash2 className="h-4 w-4" />
                        Delete Quote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <nav className="flex overflow-x-auto px-4">
                {[
                  { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
                  { id: 'items', label: 'Items', icon: <Package className="h-4 w-4" /> },
                  { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
                  { id: 'activity', label: 'Activity', icon: <History className="h-4 w-4" /> },
                  { id: 'notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-2 py-4 px-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Amount</p>
                          <h3 className="text-xl font-bold text-gray-900 mt-1 truncate">
                            {formatCurrency(quote.totalAmount)}
                          </h3>
                        </div>
                        <div className="p-2.5 bg-blue-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Items Count</p>
                          <h3 className="text-xl font-bold text-gray-900 mt-1">
                            {quote.items.length}
                          </h3>
                        </div>
                        <div className="p-2.5 bg-green-100 rounded-lg">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Status</p>
                          <h3 className="text-xl font-bold text-gray-900 mt-1 capitalize">
                            {quote.status}
                          </h3>
                        </div>
                        <div className="p-2.5 bg-purple-100 rounded-lg">
                          {statusConfig.icon}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quote Details Card */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Created Date</p>
                            <p className="font-medium text-gray-900">{formatDateTime(quote.createdAt)}</p>
                          </div>
                        </div>
                        
                        {typeof quote.opportunityId === 'object' && quote.opportunityId.customer && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Customer</p>
                              <p className="font-medium text-gray-900">{quote.opportunityId.customer.name}</p>
                              <p className="text-sm text-gray-600">Sales Representative: {getSalesRepresentativeName()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                            <Building className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Opportunity</p>
                            <p className="font-medium text-gray-900">{renderOpportunity(quote.opportunityId)}</p>
                          </div>
                        </div>
                        
                        {quote.approvedBy && (
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Approved By</p>
                              <p className="font-medium text-gray-900">
                                {typeof quote.approvedBy === 'object' 
                                  ? quote.approvedBy.name || quote.approvedBy.email 
                                  : quote.approvedBy}
                              </p>
                              {quote.approvedAt && (
                                <p className="text-sm text-gray-600">{formatDate(quote.approvedAt)}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Quote Items</h3>
                    <span className="text-sm text-gray-600">
                      {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quote.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="text-sm font-medium text-gray-900">{item.description}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm text-gray-900">{formatCurrency(item.unitPrice)}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">
                            Total Amount
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-lg font-bold text-blue-600">
                              {formatCurrency(quote.totalAmount)}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="p-5 space-y-4">
                {quote.status === 'pending' && (
                  <button
                    onClick={handleApprove}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approve Quote
                  </button>
                )}

                <button
                  onClick={handleCreateInvoice}
                  disabled={quote.status !== 'approved'}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                    quote.status === 'approved'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  Create Invoice
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </button>
                  
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete Quote
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Info Card */}
            {typeof quote.opportunityId === 'object' && quote.opportunityId.customer && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
                </div>
                
                <div className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {quote.opportunityId.customer.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{quote.opportunityId.customer.name}</h3>
                        <p className="text-sm text-gray-600">{getSalesRepresentativeName()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {quote.opportunityId.customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{quote.opportunityId.customer.email}</span>
                        </div>
                      )}
                      
                      {quote.opportunityId.customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{quote.opportunityId.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(quote.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(quote.tax || 0)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(quote.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {quote.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{quote.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Created By Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Created By</h2>
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {quote.createdBy && typeof quote.createdBy === 'object' 
                      ? (quote.createdBy.name?.charAt(0) || quote.createdBy.email?.charAt(0) || 'U').toUpperCase()
                      : 'S'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {quote.createdBy && typeof quote.createdBy === 'object' 
                        ? quote.createdBy.name || quote.createdBy.email || 'Unknown User'
                        : 'System'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(quote.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
