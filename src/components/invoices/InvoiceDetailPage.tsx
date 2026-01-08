'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Download,
  CheckCircle,
  Printer,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  Mail,
  CreditCard,
  Calendar,
  Building,
  User,
  DollarSign,
  FileText,
  Package,
  Check,
  AlertCircle,
  TrendingUp,
  Eye,
  Send,
  Copy,
  History,
  ChevronRight
} from 'lucide-react';
import { invoiceService, Invoice, INVOICE_STATUS, PAYMENT_STATUS } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

interface InvoiceDetailPageProps {
  id: string;
}

export default function InvoiceDetailPage({ id }: InvoiceDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (id: string) => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(id);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      showToast('Failed to load invoice', 'error');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- helpers ---------------- */

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case INVOICE_STATUS.APPROVED: return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case INVOICE_STATUS.SENT: return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case INVOICE_STATUS.DRAFT: return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case INVOICE_STATUS.CANCELLED: return 'bg-gradient-to-r from-red-500 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case PAYMENT_STATUS.PAID: return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case PAYMENT_STATUS.PARTIALLY_PAID: return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case PAYMENT_STATUS.UNPAID: return 'bg-gradient-to-r from-red-500 to-orange-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case INVOICE_STATUS.APPROVED: return <CheckCircle className="h-4 w-4" />;
      case INVOICE_STATUS.SENT: return <Send className="h-4 w-4" />;
      case INVOICE_STATUS.DRAFT: return <FileText className="h-4 w-4" />;
      case INVOICE_STATUS.CANCELLED: return <XCircle className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentStatusIcon = (paymentStatus: string) => {
    switch (paymentStatus) {
      case PAYMENT_STATUS.PAID: return <CheckCircle className="h-4 w-4" />;
      case PAYMENT_STATUS.PARTIALLY_PAID: return <Clock className="h-4 w-4" />;
      case PAYMENT_STATUS.UNPAID: return <AlertCircle className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const renderReference = (ref: any) => {
    if (!ref) return '-';
    if (typeof ref === 'string') return ref;
    return ref.subject || ref.quoteNumber || ref.jobTitle || ref.registrationNumber || ref._id || '—';
  };

  const getCustomerName = () => {
    if (!invoice?.opportunityId) return 'Unknown Customer';
    
    if (typeof invoice.opportunityId === 'object') {
      if (invoice.opportunityId.customer) {
        return invoice.opportunityId.customer.name || 'Unknown Customer';
      }
      return invoice.opportunityId.subject || 'Opportunity';
    }
    
    return 'Customer';
  };

  const getCustomerEmail = () => {
    if (!invoice?.opportunityId || typeof invoice.opportunityId !== 'object') return '';
    return invoice.opportunityId.customer?.email || '';
  };

  const isOverdue = () => {
    if (!invoice?.dueDate || invoice.paymentStatus === PAYMENT_STATUS.PAID) return false;
    
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  const daysUntilDue = () => {
    if (!invoice?.dueDate) return null;
    
    const due = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /* ---------------- actions ---------------- */

  const handleApprove = async () => {
    if (!invoice) return;
    
    try {
      setProcessing(true);
      const approvedInvoice = await invoiceService.approveInvoice(invoice.id);
      setInvoice(approvedInvoice);
      showToast('Invoice approved successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to approve invoice', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    
    const paymentMethod = prompt('Enter payment method:', invoice.paymentMethod || 'bank_transfer');
    if (!paymentMethod) return;
    
    const paymentReference = prompt('Enter payment reference (optional):', '');
    
    try {
      setProcessing(true);
      const paidInvoice = await invoiceService.markInvoiceAsPaid(
        invoice.id,
        undefined,
        undefined,
        paymentMethod,
        paymentReference
      );
      setInvoice(paidInvoice);
      showToast('Invoice marked as paid successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to mark invoice as paid', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      setProcessing(true);
      await invoiceService.deleteInvoice(invoice.id);
      showToast('Invoice deleted successfully', 'success');
      router.push('/invoices');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete invoice', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!invoice) return;
    
    try {
      setProcessing(true);
      // Create a simple PDF download (you might want to implement a proper PDF service)
      const invoiceText = `
INVOICE: ${invoice.invoiceNumber}
Date: ${formatDate(invoice.createdAt)}
Due Date: ${formatDate(invoice.dueDate)}
Status: ${invoiceService.getStatusText(invoice.status)}
Payment Status: ${invoiceService.getPaymentStatusText(invoice.paymentStatus)}

CUSTOMER:
${getCustomerName()}
${getCustomerEmail()}

ITEMS:
${invoice.items.map(item => 
  `${item.description} - ${item.quantity} x ${invoiceService.formatCurrency(item.unitPrice)} = ${invoiceService.formatCurrency(item.total)}`
).join('\n')}

SUBTOTAL: ${invoiceService.formatCurrency(invoice.subtotal)}
TAX: ${invoiceService.formatCurrency(invoice.tax)}
TOTAL: ${invoiceService.formatCurrency(invoice.total)}
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
      
      showToast('Invoice exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export invoice', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    
    const email = prompt('Enter recipient email:', getCustomerEmail() || 'customer@example.com');
    if (!email) return;
    
    try {
      setProcessing(true);
      // You would implement actual email sending here
      showToast(`Invoice sent to ${email}`, 'success');
    } catch (error) {
      showToast('Failed to send email', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyInvoiceNumber = () => {
    if (!invoice) return;
    
    navigator.clipboard.writeText(invoice.invoiceNumber);
    showToast('Invoice number copied to clipboard', 'success');
  };

  const handleRecordPayment = () => {
    if (!invoice) return;
    router.push(`/invoices/${invoice.id}/pay`);
  };

  /* ---------------- UI states ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
        <div className="text-center">
          <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/invoices"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  const isOverdueInvoice = isOverdue();
  const daysLeft = daysUntilDue();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/invoices" 
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
                <p className="text-blue-100">Invoice Details</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  invoice.status
                )} text-white`}
              >
                {getStatusIcon(invoice.status)}
                {invoiceService.getStatusText(invoice.status)}
              </span>
              
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(
                  invoice.paymentStatus
                )} text-white`}
              >
                {getPaymentStatusIcon(invoice.paymentStatus)}
                {invoiceService.getPaymentStatusText(invoice.paymentStatus)}
                {isOverdueInvoice && ' (Overdue)'}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-6 text-blue-100 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Issued: {formatDate(invoice.createdAt)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className={isOverdueInvoice ? 'text-red-200 font-medium' : ''}>
                  Due: {formatDate(invoice.dueDate)}
                  {daysLeft !== null && !isOverdueInvoice && ` (${daysLeft} days left)`}
                  {isOverdueInvoice && ` (${Math.abs(daysLeft || 0)} days overdue)`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">Total: {invoiceService.formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Invoice Information</h2>
                <p className="text-gray-600 text-sm mt-1">Complete invoice details and metadata</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyInvoiceNumber}
                  className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-100 hover:to-blue-200 shadow-sm border border-blue-200 hover:border-blue-300 transition-all flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy #
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={processing}
                  className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-100 hover:to-blue-200 shadow-sm border border-blue-200 hover:border-blue-300 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                {invoice.status === INVOICE_STATUS.DRAFT && (
                  <Link 
                    href={`/invoices/${invoice.id}/edit`}
                    className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:from-purple-100 hover:to-purple-200 shadow-sm border border-purple-200 hover:border-purple-300 transition-all flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <p className="text-gray-900 font-semibold">{invoice.invoiceNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <p className="text-gray-900">{getCustomerName()}</p>
                  {getCustomerEmail() && (
                    <p className="text-gray-600 text-sm mt-1">{getCustomerEmail()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opportunity
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">{renderReference(invoice.opportunityId)}</p>
                    {typeof invoice.opportunityId === 'object' && invoice.opportunityId._id && (
                      <Link 
                        href={`/opportunities/${invoice.opportunityId._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dates
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">{formatDateTime(invoice.createdAt)}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className={`font-medium ${isOverdueInvoice ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    )}
                    {invoice.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Date:</span>
                        <span className="text-green-600 font-medium">{formatDateTime(invoice.paidAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    References
                  </label>
                  <div className="space-y-2">
                    {invoice.quoteId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Quote:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{renderReference(invoice.quoteId)}</span>
                          {typeof invoice.quoteId === 'object' && invoice.quoteId._id && (
                            <Link 
                              href={`/quotes/${invoice.quoteId._id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Eye className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {invoice.jobCardId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Job Card:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{renderReference(invoice.jobCardId)}</span>
                          {typeof invoice.jobCardId === 'object' && invoice.jobCardId._id && (
                            <Link 
                              href={`/job-cards/${invoice.jobCardId._id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Eye className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Invoice Items</h2>
              <span className="text-sm text-gray-600">{invoice.items.length} items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{item.description}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-700">{item.quantity}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-700">{invoiceService.formatCurrency(item.unitPrice)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">
                          {invoiceService.formatCurrency(item.total)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="max-w-sm ml-auto space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">{invoiceService.formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900 font-medium">{invoiceService.formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{invoiceService.formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History (if any) */}
          {(invoice.paidAt || invoice.paymentReference) && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Details
                  </label>
                  <div className="space-y-3">
                    {invoice.paymentMethod && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Method</div>
                          <div className="font-medium text-gray-900">{invoice.paymentMethod}</div>
                        </div>
                      </div>
                    )}
                    
                    {invoice.paymentReference && (
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Reference</div>
                          <div className="font-medium text-gray-900">{invoice.paymentReference}</div>
                        </div>
                      </div>
                    )}
                    
                    {invoice.paidAt && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Paid On</div>
                          <div className="font-medium text-gray-900">{formatDateTime(invoice.paidAt)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {invoice.approvedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Details
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-600">Approved By</div>
                          <div className="font-medium text-gray-900">
                            {typeof invoice.approvedBy === 'object' 
                              ? invoice.approvedBy.name || invoice.approvedBy.email 
                              : invoice.approvedBy}
                          </div>
                        </div>
                      </div>
                      
                      {invoice.dateApproved && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-600">Approved On</div>
                            <div className="font-medium text-gray-900">{formatDateTime(invoice.dateApproved)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Actions</h2>
            
            <div className="space-y-3">
              {/* Status-based actions */}
              {invoice.status === INVOICE_STATUS.SENT && (
                <button 
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="h-5 w-5" />
                  Approve Invoice
                </button>
              )}

              {invoice.paymentStatus === PAYMENT_STATUS.UNPAID && invoice.status === INVOICE_STATUS.APPROVED && (
                <>
                  <button 
                    onClick={handleRecordPayment}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CreditCard className="h-5 w-5" />
                    Record Payment
                  </button>
                  
                  <button 
                    onClick={handleMarkAsPaid}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="h-5 w-5" />
                    Mark as Paid
                  </button>
                </>
              )}

              {/* General actions */}
              <button 
                onClick={handleSendEmail}
                disabled={processing}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 border border-blue-200 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail className="h-5 w-5" />
                Send Email
              </button>

              {invoice.status === INVOICE_STATUS.DRAFT && (
                <Link 
                  href={`/invoices/${invoice.id}/edit`}
                  className="block w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-xl hover:from-purple-100 hover:to-purple-200 border border-purple-200 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="h-5 w-5" />
                  Edit Invoice
                </Link>
              )}

              {/* Delete action */}
              <button 
                onClick={handleDelete}
                disabled={processing}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl hover:from-red-100 hover:to-red-200 border border-red-200 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                Delete Invoice
              </button>
            </div>
          </div>

          {/* Status Summary Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Status Summary</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Invoice Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)} text-white`}>
                    {invoiceService.getStatusText(invoice.status)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      invoice.status === INVOICE_STATUS.DRAFT ? 'bg-gray-400' :
                      invoice.status === INVOICE_STATUS.SENT ? 'bg-blue-500' :
                      invoice.status === INVOICE_STATUS.APPROVED ? 'bg-green-500' :
                      'bg-red-500'
                    }`}
                    style={{
                      width: invoice.status === INVOICE_STATUS.DRAFT ? '25%' :
                            invoice.status === INVOICE_STATUS.SENT ? '50%' :
                            invoice.status === INVOICE_STATUS.APPROVED ? '75%' : '100%'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(invoice.paymentStatus)} text-white`}>
                    {invoiceService.getPaymentStatusText(invoice.paymentStatus)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      invoice.paymentStatus === PAYMENT_STATUS.UNPAID ? 'bg-red-500' :
                      invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{
                      width: invoice.paymentStatus === PAYMENT_STATUS.UNPAID ? '0%' :
                            invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID ? '50%' : '100%'
                    }}
                  />
                </div>
              </div>

              {isOverdueInvoice && (
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Invoice is overdue</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    This invoice was due {Math.abs(daysLeft || 0)} days ago
                  </p>
                </div>
              )}

              {invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID && (
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Partially Paid</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Partial payment received
                  </p>
                </div>
              )}

              {invoice.paymentStatus === PAYMENT_STATUS.PAID && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Fully Paid</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Payment completed on {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Stats</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Invoice Amount</span>
                <span className="text-lg font-bold text-gray-900">{invoiceService.formatCurrency(invoice.total)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Items Count</span>
                <span className="font-medium text-gray-900">{invoice.items.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">{formatDate(invoice.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-gray-900">{formatDate(invoice.updatedAt)}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Ready for next steps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}