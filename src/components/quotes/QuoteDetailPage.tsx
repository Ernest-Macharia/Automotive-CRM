'use client';

import { useState, useEffect } from 'react';
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
  XCircle
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

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadQuote(id);
    }
  }, [id]);

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

  /* ---------------- helpers ---------------- */

  const renderOpportunity = (op: any) => {
    if (!op) return '-';
    if (typeof op === 'string') return op;
    return op.subject || op._id || '—';
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

  /* ---------------- actions ---------------- */

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

  /* ---------------- UI states ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Quote not found</p>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/quotes" className="p-2 hover:bg-white/20 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
              <p className="text-blue-100">Quote Details</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
              quote.status
            )} text-white`}
          >
            {quote.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
             quote.status === 'pending' ? <Clock className="h-4 w-4" /> :
             quote.status === 'rejected' ? <XCircle className="h-4 w-4" /> :
             <FileText className="h-4 w-4" />}
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">Quote Information</h2>
              <div className="flex gap-2">
                <button onClick={handleExportPDF} className="btn-soft-blue">
                  <Download className="h-4 w-4" /> PDF
                </button>
                <Link href={`/quotes/${quote.id}/edit`} className="btn-soft-purple">
                  <Edit className="h-4 w-4" /> Edit
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="label">Quote Number</p>
                <p className="value">{quote.quoteNumber}</p>

                <p className="label mt-4">Opportunity</p>
                <p className="value">{renderOpportunity(quote.opportunityId)}</p>

                <p className="label mt-4">Created</p>
                <p className="value">
                  {new Date(quote.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold mb-6">Quote Items</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-600">
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{quoteService.formatCurrency(item.unitPrice)}</td>
                    <td className="font-semibold">
                      {quoteService.formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold mb-6">Summary</h2>

            <div className="flex justify-between">
              <span>Total</span>
              <span className="text-xl font-bold">
                {quoteService.formatCurrency(quote.totalAmount)}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {quote.status === 'pending' && (
                <button onClick={handleApprove} className="btn-primary-green">
                  <CheckCircle className="h-5 w-5" />
                  Approve Quote
                </button>
              )}

              <button onClick={handleCreateInvoice} className="btn-primary-purple">
                <FileText className="h-5 w-5" />
                Create Invoice
              </button>

              <button onClick={handleDelete} className="btn-soft-red">
                <Trash2 className="h-4 w-4" />
                Delete Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
