'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Download,
  CheckCircle,
  Printer,
  ArrowLeft,
  Clock,
  XCircle,
  Mail,
  Calendar,
  User,
  DollarSign,
  FileText,
  Check,
  AlertCircle,
  Eye,
  Copy,
  Loader2,
  PackageCheck,
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

  const canMarkAsPaid = () => {
    if (!invoice) return false;
    
    // Only allow marking as paid if invoice is unpaid
    return invoice.paymentStatus === PAYMENT_STATUS.UNPAID;
  };

  /* ---------------- actions ---------------- */

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    
    setProcessing(true);
    try {
      // Mark invoice as paid
      const paidInvoice = await invoiceService.markInvoiceAsPaid(
        invoice.id,
        invoice.total,
        new Date().toISOString(),
        'cash', // Default payment method
        `PAYMENT-${Date.now().toString(36).toUpperCase()}`
      );
      
      setInvoice(paidInvoice);
      showToast('Invoice marked as paid successfully!', 'success');
      
      // Show completion message
      setTimeout(() => {
        showToast('Payment recorded. The related work order has been completed.', 'success');
      }, 1000);
      
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      showToast(error.message || 'Failed to mark invoice as paid', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyInvoiceNumber = () => {
    if (!invoice) return;
    
    navigator.clipboard.writeText(invoice.invoiceNumber);
    showToast('Invoice number copied to clipboard', 'success');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6">
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
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
              {invoice.paymentStatus === PAYMENT_STATUS.PAID ? (
                <CheckCircle className="h-4 w-4" />
              ) : invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID ? (
                <Clock className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {invoiceService.getPaymentStatusText(invoice.paymentStatus)}
              {isOverdueInvoice && ' (Overdue)'}
            </span>
            
            {invoice.paymentStatus === PAYMENT_STATUS.PAID && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <PackageCheck className="h-3.5 w-3.5" />
                Paid
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
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
                      <p className="text-sm text-gray-900">
                        {typeof invoice.opportunityId === 'object' 
                          ? invoice.opportunityId.subject || invoice.opportunityId._id
                          : invoice.opportunityId || '—'}
                      </p>
                      {typeof invoice.opportunityId === 'object' && invoice.opportunityId._id && (
                        <Link 
                          href={`/opportunities/${invoice.opportunityId._id}`}
                          className="text-blue-600 hover:underline text-xs inline-flex items-center"
                        >
                          View <ChevronRight className="h-3 w-3 ml-0.5" />
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
                      {invoice.workOrderId && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Work Order:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">
                              {typeof invoice.workOrderId === 'object' 
                                ? invoice.workOrderId.workOrderNumber || invoice.workOrderId._id
                                : invoice.workOrderId}
                            </span>
                            {typeof invoice.workOrderId === 'object' && invoice.workOrderId._id && (
                              <Link 
                                href={`/orders/work-orders/${invoice.workOrderId._id}`}
                                className="text-blue-600 hover:underline text-xs"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                      {invoice.quoteId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quote:</span>
                          <span className="text-gray-900">
                            {typeof invoice.quoteId === 'object' 
                              ? invoice.quoteId.quoteNumber || invoice.quoteId._id
                              : invoice.quoteId}
                          </span>
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

            {/* Payment Status Section */}
            {invoice.paymentStatus === PAYMENT_STATUS.PAID && invoice.paidAt && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">Invoice Paid</h2>
                    <p className="text-xs text-gray-600">Payment completed successfully</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(invoice.paidAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                      <p className="text-sm font-medium text-gray-900">{invoiceService.formatCurrency(invoice.total)}</p>
                    </div>
                  </div>
                  
                  {/* Show work order completion if applicable */}
                  {invoice.workOrderId && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <PackageCheck className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-green-800">Work Order Completed</p>
                      </div>
                      <p className="text-xs text-green-700">
                        The related work order has been marked as completed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Payment Action Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Payment</h2>
                  <p className="text-xs text-gray-600">Record payment for this invoice</p>
                </div>
              </div>
              
              {invoice.paymentStatus === PAYMENT_STATUS.PAID ? (
                <div className="text-center py-4">
                  <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Invoice Paid</p>
                  <p className="text-xs text-gray-600">
                    Payment completed on {formatDate(invoice.paidAt)}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Payment Status */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Status</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                        {invoiceService.getPaymentStatusText(invoice.paymentStatus)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-full rounded-full bg-red-500"
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>
                  
                  {/* Amount Due */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Amount Due</p>
                    <p className="text-xl font-bold text-gray-900">{invoiceService.formatCurrency(invoice.total)}</p>
                  </div>
                  
                  {/* Mark as Paid Button */}
                  <button 
                    onClick={handleMarkAsPaid}
                    disabled={processing || !canMarkAsPaid()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Mark as Paid
                      </>
                    )}
                  </button>
                  
                  {invoice.dueDate && isOverdueInvoice && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Overdue by {Math.abs(Math.floor((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} days
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Total</span>
                  <span className="font-medium text-gray-900">{invoiceService.formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="text-gray-900">{invoice.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900">{formatDate(invoice.createdAt)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date</span>
                    <span className={`font-medium ${isOverdueInvoice ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                )}
                
                {/* Show payment info if paid */}
                {invoice.paymentStatus === PAYMENT_STATUS.PAID && invoice.paidAt && (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid On</span>
                        <span className="text-gray-900">{formatDate(invoice.paidAt)}</span>
                      </div>
                    </div>
                    {invoice.workOrderId && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-700">
                          ✓ Related work order automatically completed
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Related Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Related</h2>
              <div className="space-y-2">
                {invoice.opportunityId && typeof invoice.opportunityId === 'object' && invoice.opportunityId._id && (
                  <Link
                    href={`/opportunities/${invoice.opportunityId._id}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">Opportunity</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                )}
                {invoice.workOrderId && typeof invoice.workOrderId === 'object' && invoice.workOrderId._id && (
                  <Link
                    href={`/orders/work-orders/${invoice.workOrderId._id}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">Work Order</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                )}
                {invoice.quoteId && typeof invoice.quoteId === 'object' && invoice.quoteId._id && (
                  <Link
                    href={`/quotes/${invoice.quoteId._id}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">Quote</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}