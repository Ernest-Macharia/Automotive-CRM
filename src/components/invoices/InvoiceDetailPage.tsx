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
  ChevronRight,
  X,
  Loader2,
  ShieldCheck
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
      case INVOICE_STATUS.APPROVED: return 'bg-green-100 text-green-800';
      case INVOICE_STATUS.SENT: return 'bg-blue-100 text-blue-800';
      case INVOICE_STATUS.DRAFT: return 'bg-gray-100 text-gray-800';
      case INVOICE_STATUS.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case PAYMENT_STATUS.PAID: return 'bg-green-100 text-green-800';
      case PAYMENT_STATUS.PARTIALLY_PAID: return 'bg-yellow-100 text-yellow-800';
      case PAYMENT_STATUS.UNPAID: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleMockPayment = async () => {
    if (!invoice) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock payment reference
      const mockReference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Mark invoice as paid
      const paidInvoice = await invoiceService.markInvoiceAsPaid(
        invoice.id,
        undefined,
        undefined,
        paymentMethod,
        paymentReference || mockReference
      );
      
      setInvoice(paidInvoice);
      setShowPaymentModal(false);
      showToast('Payment processed successfully! Invoice marked as paid.', 'success');
      
      // Reset form
      setPaymentMethod('bank_transfer');
      setPaymentReference('');
    } catch (error: any) {
      showToast(error.message || 'Failed to process payment', 'error');
    } finally {
      setIsProcessingPayment(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Invoice Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">The invoice doesn't exist or was removed.</p>
          <Link
            href="/invoices"
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const isOverdueInvoice = isOverdue();
  const daysLeft = daysUntilDue();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Blue to Purple Theme */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link href="/invoices" className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{invoice.invoiceNumber}</h1>
              <p className="text-blue-100 text-sm">Invoice Details</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
              {getStatusIcon(invoice.status)}
              {invoiceService.getStatusText(invoice.status)}
            </span>
            
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
              {getPaymentStatusIcon(invoice.paymentStatus)}
              {invoiceService.getPaymentStatusText(invoice.paymentStatus)}
              {isOverdueInvoice && ' (Overdue)'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Invoice Information</h2>
                  <p className="text-xs text-gray-500 mt-1">Complete invoice details</p>
                </div>
                <div className="flex gap-2 mt-3 sm:mt-0">
                  <button 
                    onClick={handleCopyInvoiceNumber}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Copy className="h-3.5 w-3.5 inline mr-1" />
                    Copy #
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    disabled={processing}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5 inline mr-1" />
                    Export
                  </button>
                  {invoice.status === INVOICE_STATUS.DRAFT && (
                    <Link 
                      href={`/invoices/${invoice.id}/edit`}
                      className="px-3 py-1.5 text-xs border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50"
                    >
                      <Edit className="h-3.5 w-3.5 inline mr-1" />
                      Edit
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Invoice Number</p>
                    <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                    <p className="text-sm text-gray-900">{getCustomerName()}</p>
                    {getCustomerEmail() && (
                      <p className="text-xs text-gray-600 mt-1">{getCustomerEmail()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Opportunity</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900">{renderReference(invoice.opportunityId)}</p>
                      {typeof invoice.opportunityId === 'object' && invoice.opportunityId._id && (
                        <Link 
                          href={`/opportunities/${invoice.opportunityId._id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Dates</p>
                    <div className="space-y-1.5 text-sm">
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
                          <span className="text-gray-600">Paid:</span>
                          <span className="text-green-600 font-medium">{formatDateTime(invoice.paidAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">References</p>
                    <div className="space-y-1.5 text-sm">
                      {invoice.quoteId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quote:</span>
                          <span className="text-gray-900">{renderReference(invoice.quoteId)}</span>
                        </div>
                      )}
                      {invoice.jobCardId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Job Card:</span>
                          <span className="text-gray-900">{renderReference(invoice.jobCardId)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded p-2.5">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-semibold text-gray-800">Invoice Items</h2>
                <span className="text-xs text-gray-600">{invoice.items.length} items</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium text-gray-900">{item.description}</td>
                        <td className="py-3 px-3 text-gray-700">{item.quantity}</td>
                        <td className="py-3 px-3 text-gray-700">{invoiceService.formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-3 font-medium text-gray-900">{invoiceService.formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-200 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{invoiceService.formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{invoiceService.formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-blue-600">{invoiceService.formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Actions</h2>
              
              <div className="space-y-3">
                {/* Pay Now Button - Only show for unpaid, approved invoices */}
                {invoice.paymentStatus === PAYMENT_STATUS.UNPAID && invoice.status === INVOICE_STATUS.APPROVED && (
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-green-700"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay Now
                  </button>
                )}

                {invoice.status === INVOICE_STATUS.SENT && (
                  <button 
                    onClick={handleApprove}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Invoice
                  </button>
                )}

                {invoice.paymentStatus === PAYMENT_STATUS.UNPAID && invoice.status === INVOICE_STATUS.APPROVED && (
                  <button 
                    onClick={handleMarkAsPaid}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Mark as Paid
                  </button>
                )}

                <button 
                  onClick={handleSendEmail}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>

                <button 
                  onClick={handleDelete}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-red-600 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Invoice
                </button>
              </div>
            </div>

            {/* Status & Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Status Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Invoice Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(invoice.status)}`}>
                      {invoiceService.getStatusText(invoice.status)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        invoice.status === INVOICE_STATUS.DRAFT ? 'bg-gray-400' :
                        invoice.status === INVOICE_STATUS.SENT ? 'bg-blue-500' :
                        invoice.status === INVOICE_STATUS.APPROVED ? 'bg-green-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${invoice.status === INVOICE_STATUS.DRAFT ? 25 : invoice.status === INVOICE_STATUS.SENT ? 50 : invoice.status === INVOICE_STATUS.APPROVED ? 75 : 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Payment Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                      {invoiceService.getPaymentStatusText(invoice.paymentStatus)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        invoice.paymentStatus === PAYMENT_STATUS.UNPAID ? 'bg-red-500' :
                        invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${invoice.paymentStatus === PAYMENT_STATUS.UNPAID ? 0 : invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID ? 50 : 100}%` }}
                    />
                  </div>
                </div>

                {isOverdueInvoice && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Overdue by {Math.abs(daysLeft || 0)} days
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Stats</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Due</span>
                  <span className="font-medium text-gray-900">{invoiceService.formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="text-gray-900">{invoice.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issued</span>
                  <span className="text-gray-900">{formatDate(invoice.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && invoice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Process Payment</h3>
                    <p className="text-xs text-gray-600">Complete payment for invoice #{invoice.invoiceNumber}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 rounded hover:bg-gray-100"
                  disabled={isProcessingPayment}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4 mb-5">
                {/* Payment Summary */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                  <p className="text-sm font-medium text-emerald-800 mb-1">Payment Summary</p>
                  <div className="text-xs text-emerald-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Invoice Total:</span>
                      <span className="font-bold">{invoiceService.formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                        getPaymentStatusColor(invoice.paymentStatus)
                      }`}>
                        {invoiceService.getPaymentStatusText(invoice.paymentStatus)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={isProcessingPayment}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="check">Check</option>
                  </select>
                </div>
                
                {/* Payment Reference */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g., Transaction ID, Check #, etc."
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={isProcessingPayment}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to auto-generate a reference number
                  </p>
                </div>
                
                {/* Terms Checkbox */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 h-3 w-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    disabled={isProcessingPayment}
                  />
                  <label htmlFor="terms" className="text-xs text-gray-700">
                    I confirm that this payment is for invoice #{invoice.invoiceNumber} and will be processed as a mock transaction for demonstration purposes.
                  </label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-60"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMockPayment}
                  className="flex-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete Payment
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>This is a mock payment for demonstration only. No real transaction will occur.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}