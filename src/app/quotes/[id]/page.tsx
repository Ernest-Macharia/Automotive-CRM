'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Mail,
  CheckCircle,
  Printer,
  Copy,
  Calendar,
  User,
  Building,
  Car,
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Percent,
  Package,
  Clock,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Share2,
  Eye,
  XCircle
} from 'lucide-react';
import { quoteService, Quote } from '@/services/quoteService';
import { invoiceService } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (params.id) {
      loadQuote(params.id as string);
    }
  }, [params.id]);

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

  const handleApprove = async () => {
    if (!quote) return;
    
    try {
      const approvedQuote = await quoteService.approveQuote(quote.id);
      setQuote(approvedQuote);
      showToast('Quote approved successfully', 'success');
    } catch (error) {
      console.error('Error approving quote:', error);
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
    } catch (error) {
      console.error('Error deleting quote:', error);
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
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Failed to export PDF', 'error');
    }
  };

  const handleCreateInvoice = async () => {
    if (!quote) return;
    
    try {
      const invoice = await invoiceService.createInvoiceFromQuote(quote.id);
      showToast('Invoice created successfully', 'success');
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('Failed to create invoice', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'pending': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'draft': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">Quote not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/quotes"
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
                <p className="text-blue-100">Quote Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(quote.status)} text-white`}>
                {quote.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
                 quote.status === 'pending' ? <Clock className="h-4 w-4" /> :
                 quote.status === 'rejected' ? <XCircle className="h-4 w-4" /> :
                 <FileText className="h-4 w-4" />}
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Info Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Quote Information</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </button>
                  <Link
                    href={`/quotes/${quote.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Quote Number</p>
                    <p className="font-semibold text-gray-900">{quote.quoteNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Opportunity ID</p>
                    <p className="font-semibold text-gray-900">{quote.opportunityId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {quote.validUntil && (
                    <div>
                      <p className="text-sm text-gray-600">Valid Until</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(quote.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {quote.createdBy && (
                    <div>
                      <p className="text-sm text-gray-600">Created By</p>
                      <p className="font-semibold text-gray-900">{quote.createdBy}</p>
                    </div>
                  )}
                  {quote.approvedBy && (
                    <div>
                      <p className="text-sm text-gray-600">Approved By</p>
                      <p className="font-semibold text-gray-900">{quote.approvedBy}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {quote.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="text-gray-900">{quote.notes}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quote Items</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quote.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.description}</p>
                            {item.sku && (
                              <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-4 text-gray-900">
                          {quoteService.formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-900">
                          {quoteService.formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {quoteService.formatCurrency(quote.subtotal || 
                      quote.items.reduce((sum, item) => sum + item.total, 0)
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">
                    {quoteService.formatCurrency(quote.tax || 0)}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {quoteService.formatCurrency(quote.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 space-y-3">
                {quote.status === 'pending' && (
                  <button
                    onClick={handleApprove}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approve Quote
                  </button>
                )}
                
                <button
                  onClick={handleCreateInvoice}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  <FileText className="h-5 w-5" />
                  Create Invoice
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl font-medium hover:from-blue-100 hover:to-blue-200 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                  
                  <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-xl font-medium hover:from-gray-100 hover:to-gray-200 transition-all"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                </div>
                
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl font-medium hover:from-red-100 hover:to-red-200 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Quote
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quote Timeline</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Quote Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(quote.createdAt).toLocaleString()}
                    </p>
                    {quote.createdBy && (
                      <p className="text-xs text-gray-500">By: {quote.createdBy}</p>
                    )}
                  </div>
                </div>
                
                {quote.approvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Quote Approved</p>
                      <p className="text-sm text-gray-600">
                        {new Date(quote.approvedAt).toLocaleString()}
                      </p>
                      {quote.approvedBy && (
                        <p className="text-xs text-gray-500">By: {quote.approvedBy}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {quote.validUntil && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Valid Until</p>
                      <p className="text-sm text-gray-600">
                        {new Date(quote.validUntil).toLocaleDateString()}
                      </p>
                      <p className={`text-xs font-medium ${
                        new Date(quote.validUntil) > new Date() 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {new Date(quote.validUntil) > new Date() ? 'Active' : 'Expired'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}