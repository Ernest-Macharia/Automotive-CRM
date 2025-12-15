'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Mail, 
  CheckCircle,
  RefreshCw,
  Receipt,
  CreditCard,
  Calendar,
  User,
  Building,
  Wallet,
  Smartphone
} from 'lucide-react';
import { paymentService, Payment } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PaymentDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('id');
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    } else {
      setError('No payment ID provided');
      setLoading(false);
    }
  }, [paymentId]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!paymentId) return;
      
      const paymentData = await paymentService.getPaymentById(paymentId);
      setPayment(paymentData);
      
      if (paymentData.invoiceId) {
        try {
          const invoiceData = await invoiceService.getInvoiceById(paymentData.invoiceId);
          setInvoice(invoiceData);
        } catch (invoiceError) {
          console.error('Error loading invoice:', invoiceError);
        }
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReceipt = async () => {
    if (!payment) return;
    try {
      const blob = await paymentService.exportPaymentToPDF(payment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting receipt:', error);
      alert('Failed to export receipt');
    }
  };

  const handleReconcile = async () => {
    if (!payment) return;
    try {
      const updated = await paymentService.reconcilePayment(payment.id);
      setPayment(updated);
      alert('Payment marked as completed');
    } catch (error) {
      console.error('Error reconciling payment:', error);
      alert('Failed to reconcile payment');
    }
  };

  const handleRefund = async () => {
    if (!payment) return;
    const amount = prompt('Enter refund amount:', payment.amountPaid.toString());
    const reason = prompt('Enter refund reason:', '');
    
    if (!amount || !reason) return;
    
    try {
      const updatedPayment = await paymentService.refundPayment(payment.id, {
        amount: parseFloat(amount),
        reason
      });
      setPayment(updatedPayment);
      alert('Payment refunded successfully');
    } catch (error) {
      console.error('Error refunding payment:', error);
      alert('Failed to refund payment');
    }
  };

  const handleSendEmail = () => {
    const email = prompt('Enter recipient email:', 'customer@example.com');
    if (email) {
      alert(`Receipt sent to ${email}`);
      // In a real app, you would call an API to send the email
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-6 w-6" />;
      case 'card':
        return <CreditCard className="h-6 w-6" />;
      case 'bank_transfer':
        return <Building className="h-6 w-6" />;
      case 'mobile_money':
        return <Smartphone className="h-6 w-6" />;
      case 'cheque':
        return <Receipt className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !payment) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6">
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {error || 'Payment not found'}
            </h3>
            <button
              onClick={() => router.back()}
              className="mt-4 inline-flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
              <p className="text-sm text-gray-600">Receipt {payment.receiptNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportReceipt}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Receipt
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm opacity-90">Total Amount Paid</div>
                  <div className="text-3xl font-bold mt-1">
                    {paymentService.formatCurrency(payment.amountPaid)}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${paymentService.getStatusColor(payment.status)}`}>
                  {payment.status === 'completed' && <CheckCircle className="h-6 w-6" />}
                  {payment.status === 'pending' && <RefreshCw className="h-6 w-6" />}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm opacity-90">Payment Method</div>
                  <div className="font-medium">
                    {paymentService.formatMethodName(payment.method)}
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Reference</div>
                  <div className="font-medium font-mono">
                    {payment.referenceNumber}
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Payment Date</div>
                  <div className="font-medium">
                    {paymentService.formatDate(payment.paymentDate)}
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Balance</div>
                  <div className="font-medium">
                    {paymentService.formatCurrency(payment.balanceRemaining)}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            {invoice && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Related Invoice</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Invoice Number</div>
                    <div className="font-medium text-purple-600">{invoice.invoiceNumber}</div>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                    <div className="font-medium">
                      {paymentService.formatCurrency(invoice.totalAmount)}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Amount Paid</div>
                    <div className="font-medium text-green-600">
                      {paymentService.formatCurrency(invoice.paidAmount)}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                    <div className="font-medium text-red-600">
                      {paymentService.formatCurrency(invoice.balance)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {payment.notes && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
                <p className="text-gray-600">{payment.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleExportReceipt}
                  className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Receipt</span>
                </button>
                <button
                  onClick={handleSendEmail}
                  className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Send via Email</span>
                </button>
                {payment.status === 'pending' && (
                  <button
                    onClick={handleReconcile}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark as Completed</span>
                  </button>
                )}
                {payment.status === 'completed' && (
                  <button
                    onClick={handleRefund}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Process Refund</span>
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentService.getStatusColor(payment.status)}`}>
                    {paymentService.formatStatusName(payment.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment ID</span>
                  <span className="font-mono text-sm">
                    {payment.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Method</span>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(payment.method)}
                    <span>{paymentService.formatMethodName(payment.method)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Created</span>
                  <span>{paymentService.formatDate(payment.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Updated</span>
                  <span>{paymentService.formatDate(payment.updatedAt)}</span>
                </div>
                {payment.recordedBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Recorded By</span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {payment.recordedBy}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}