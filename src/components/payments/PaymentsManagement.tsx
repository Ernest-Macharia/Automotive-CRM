'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Receipt,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { paymentService, Payment, PaymentsResponse } from '@/services/paymentService';
import CreatePaymentModal from './CreatePaymentModal';
import PaymentDetailModal from './PaymentDetailModal';

export default function PaymentsManagement() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<any>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Payment | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const methods = ['cash', 'card', 'bank_transfer', 'mobile_money', 'cheque'];
  const statuses = ['pending', 'completed', 'failed', 'refunded'];

  useEffect(() => {
    loadPayments();
    loadStats();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAllPayments();
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
      showToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await paymentService.getPaymentStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const handleCreatePayment = async (data: any) => {
    try {
      const newPayment = await paymentService.createPayment(data);
      setPayments(prev => [newPayment, ...prev]);
      showToast('Payment recorded successfully', 'success');
      setShowCreateModal(false);
      loadStats();
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast('Failed to record payment', 'error');
    }
  };

  const handleReconcilePayment = async (payment: Payment) => {
    try {
      const updatedPayment = await paymentService.reconcilePayment(payment.id);
      setPayments(prev => prev.map(p => p.id === payment.id ? updatedPayment : p));
      showToast('Payment reconciled successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error reconciling payment:', error);
      showToast('Failed to reconcile payment', 'error');
    }
  };

  const handleRefundPayment = async (payment: Payment) => {
    const amount = prompt('Enter refund amount:', payment.amountPaid.toString());
    const reason = prompt('Enter refund reason:', '');
    
    if (!amount || !reason) return;
    
    try {
      const updatedPayment = await paymentService.refundPayment(payment.id, {
        amount: parseFloat(amount),
        reason
      });
      setPayments(prev => prev.map(p => p.id === payment.id ? updatedPayment : p));
      showToast('Payment refunded successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error refunding payment:', error);
      showToast('Failed to refund payment', 'error');
    }
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    try {
      await paymentService.deletePayment(payment.id);
      setPayments(prev => prev.filter(p => p.id !== payment.id));
      showToast('Payment deleted successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('Failed to delete payment', 'error');
    }
  };

  const handleExportReceipt = async (payment: Payment) => {
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
      showToast('Receipt exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting receipt:', error);
      showToast('Failed to export receipt', 'error');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-green-500" />
            Payments & Reconciliation
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Record, track, and reconcile payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadPayments}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Payments</p>
              <p className="text-2xl font-bold text-green-800">
                {stats?.total || 0}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-green-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-blue-800">
                {paymentService.formatCurrency(stats?.totalAmount || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Today's Payments</p>
              <p className="text-2xl font-bold text-yellow-800">
                {paymentService.formatCurrency(stats?.todayAmount || 0)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Average Payment</p>
              <p className="text-2xl font-bold text-purple-800">
                {paymentService.formatCurrency(stats?.averagePayment || 0)}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500 opacity-70" />
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
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Methods</option>
            {methods.map(method => (
              <option key={method} value={method}>
                {paymentService.formatMethodName(method)}
              </option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {paymentService.formatStatusName(status)}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterMethod('all');
              setFilterStatus('all');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount & Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {payment.receiptNumber}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Invoice: {payment.invoiceId.substring(0, 8)}...
                            </div>
                            {payment.referenceNumber && (
                              <div className="text-xs text-gray-400 mt-1">
                                Ref: {payment.referenceNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-gray-900">
                          {paymentService.formatCurrency(payment.amountPaid)}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentService.getMethodColor(payment.method)}`}>
                          {paymentService.formatMethodName(payment.method)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {payment.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {payment.status === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          {payment.status === 'failed' && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentService.getStatusColor(payment.status)}`}>
                            {paymentService.formatStatusName(payment.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Balance: {paymentService.formatCurrency(payment.balanceRemaining)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {paymentService.formatDate(payment.paymentDate)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDetailModal(payment)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => handleReconcilePayment(payment)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Reconcile Payment"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleExportReceipt(payment)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Export Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => handleRefundPayment(payment)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Refund Payment"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/payments/details?id=${payment.id}`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Payment"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeletePayment(payment)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Payment"
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
      <CreatePaymentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePayment}
      />
      
      {showDetailModal && (
        <PaymentDetailModal
          payment={showDetailModal}
          isOpen={!!showDetailModal}
          onClose={() => setShowDetailModal(null)}
          onExport={handleExportReceipt}
          onReconcile={handleReconcilePayment}
          onRefund={handleRefundPayment}
        />
      )}
    </div>
  );
}