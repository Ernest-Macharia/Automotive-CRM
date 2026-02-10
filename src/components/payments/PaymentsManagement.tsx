// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Wallet,
//   Plus,
//   CheckCircle,
//   Clock,
//   XCircle,
//   RefreshCw,
//   Download,
//   Filter,
//   Search,
//   Eye,
//   Edit,
//   Trash2,
//   CreditCard,
//   Receipt,
//   Calendar,
//   TrendingUp,
//   Loader2,
//   ChevronRight
// } from 'lucide-react';
// import { useToast } from '@/contexts/ToastContext';
// import { paymentService, Payment, PaymentsResponse } from '@/services/paymentService';
// import CreatePaymentModal from './CreatePaymentModal';
// import PaymentDetailModal from './PaymentDetailModal';

// // Skeleton Components
// const SkeletonStats = () => (
//   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//     {[1, 2, 3, 4].map((i) => (
//       <div key={i} className="rounded-xl p-4 border animate-pulse" style={{ 
//         background: i === 4 ? 'linear-gradient(to right, #8b5cf6, #6366f1)' : 'linear-gradient(to right, #f0f9ff, #e0f2fe)',
//         borderColor: i === 4 ? 'transparent' : '#bfdbfe'
//       }}>
//         <div className="flex items-center justify-between">
//           <div>
//             <div className="h-4 w-24 bg-white/50 rounded mb-2"></div>
//             <div className="h-8 w-16 bg-white/70 rounded"></div>
//           </div>
//           <div className="p-3 rounded-xl bg-white/30">
//             <div className="h-6 w-6 bg-white/50 rounded"></div>
//           </div>
//         </div>
//       </div>
//     ))}
//   </div>
// );

// const SkeletonRow = () => (
//   <tr className="border-b border-gray-100 hover:bg-gray-50">
//     <td className="px-6 py-4">
//       <div className="flex items-center gap-3">
//         <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
//         <div>
//           <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-1"></div>
//           <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
//         </div>
//       </div>
//     </td>
//     <td className="px-6 py-4">
//       <div className="space-y-1">
//         <div className="h-5 w-20 bg-gray-300 rounded animate-pulse"></div>
//         <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
//       </div>
//     </td>
//     <td className="px-6 py-4">
//       <div className="space-y-1">
//         <div className="flex items-center gap-2">
//           <div className="h-4 w-4 bg-gray-300 rounded-full animate-pulse"></div>
//           <div className="h-4 w-16 bg-gray-300 rounded-full animate-pulse"></div>
//         </div>
//         <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
//       </div>
//     </td>
//     <td className="px-6 py-4">
//       <div className="space-y-1">
//         <div className="h-3 w-20 bg-gray-300 rounded animate-pulse"></div>
//         <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
//       </div>
//     </td>
//     <td className="px-6 py-4">
//       <div className="flex items-center gap-2">
//         <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
//         <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
//         <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
//         <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
//       </div>
//     </td>
//   </tr>
// );

// export default function PaymentsManagement() {
//   const router = useRouter();
//   const { showToast } = useToast();
  
//   const [payments, setPayments] = useState<Payment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterMethod, setFilterMethod] = useState('all');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [stats, setStats] = useState<any>(null);
//   const [statsLoading, setStatsLoading] = useState(true);
  
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDetailModal, setShowDetailModal] = useState<Payment | null>(null);
//   const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
//   const methods = ['cash', 'card', 'bank_transfer', 'mobile_money', 'cheque'];
//   const statuses = ['pending', 'completed', 'failed', 'refunded'];

//   const loadPayments = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await paymentService.getAllPayments();
//       setPayments(response.data);
//     } catch (error) {
//       console.error('Error loading payments:', error);
//       showToast('Failed to load payments', 'error');
//     } finally {
//       setLoading(false);
//     }
//   }, [showToast]);

//   const loadStats = useCallback(async () => {
//     try {
//       setStatsLoading(true);
//       const data = await paymentService.getPaymentStats();
//       setStats(data);
//     } catch (error) {
//       console.error('Error loading payment stats:', error);
//     } finally {
//       setStatsLoading(false);
//     }
//   }, []);

//   const handleRefresh = async () => {
//     try {
//       setRefreshing(true);
//       await Promise.all([loadPayments(), loadStats()]);
//       showToast('Payments refreshed', 'success');
//     } catch (error) {
//       console.error('Error refreshing:', error);
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     loadPayments();
//     loadStats();
//   }, [loadPayments, loadStats]);

//   const handleCreatePayment = async (data: any) => {
//     try {
//       const newPayment = await paymentService.createPayment(data);
//       setPayments(prev => [newPayment, ...prev]);
//       showToast('Payment recorded successfully', 'success');
//       setShowCreateModal(false);
//       loadStats();
//     } catch (error) {
//       console.error('Error creating payment:', error);
//       showToast('Failed to record payment', 'error');
//     }
//   };

//   const handleReconcilePayment = async (payment: Payment) => {
//     try {
//       const updatedPayment = await paymentService.reconcilePayment(payment.id);
//       setPayments(prev => prev.map(p => p.id === payment.id ? updatedPayment : p));
//       showToast('Payment reconciled successfully', 'success');
//       loadStats();
//     } catch (error) {
//       console.error('Error reconciling payment:', error);
//       showToast('Failed to reconcile payment', 'error');
//     }
//   };

//   const handleRefundPayment = async (payment: Payment) => {
//     const amount = prompt('Enter refund amount:', payment.amountPaid.toString());
//     const reason = prompt('Enter refund reason:', '');
    
//     if (!amount || !reason) return;
    
//     try {
//       const updatedPayment = await paymentService.refundPayment(payment.id, {
//         amount: parseFloat(amount),
//         reason
//       });
//       setPayments(prev => prev.map(p => p.id === payment.id ? updatedPayment : p));
//       showToast('Payment refunded successfully', 'success');
//       loadStats();
//     } catch (error) {
//       console.error('Error refunding payment:', error);
//       showToast('Failed to refund payment', 'error');
//     }
//   };

//   const handleDeletePayment = async (payment: Payment) => {
//     if (!confirm('Are you sure you want to delete this payment?')) return;
    
//     try {
//       await paymentService.deletePayment(payment.id);
//       setPayments(prev => prev.filter(p => p.id !== payment.id));
//       showToast('Payment deleted successfully', 'success');
//       loadStats();
//     } catch (error) {
//       console.error('Error deleting payment:', error);
//       showToast('Failed to delete payment', 'error');
//     }
//   };

//   const handleExportReceipt = async (payment: Payment) => {
//     try {
//       const blob = await paymentService.exportPaymentToPDF(payment.id);
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `receipt-${payment.receiptNumber}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//       showToast('Receipt exported successfully', 'success');
//     } catch (error) {
//       console.error('Error exporting receipt:', error);
//       showToast('Failed to export receipt', 'error');
//     }
//   };

//   const filteredPayments = payments.filter(payment => {
//     const matchesSearch = 
//       payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
//     const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
//     return matchesSearch && matchesMethod && matchesStatus;
//   });

//   return (
//     <div className="flex-1 flex flex-col overflow-hidden">
//       {/* Header - Fixed */}
//       <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
//         <div className="flex items-center justify-between w-full">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-white/20 rounded-xl">
//               <Wallet className="h-6 w-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-white">Payments</h1>
//               <p className="text-blue-100 text-sm">Record, track, and reconcile payments</p>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-3">
//             <button
//               onClick={handleRefresh}
//               disabled={refreshing}
//               className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
//               title="Refresh"
//             >
//               {refreshing ? (
//                 <Loader2 className="h-5 w-5 text-white animate-spin" />
//               ) : (
//                 <RefreshCw className="h-5 w-5 text-white" />
//               )}
//             </button>
//             <button
//               onClick={() => setShowCreateModal(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90"
//             >
//               <Plus className="h-5 w-5" />
//               <span className="hidden sm:inline">Record Payment</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content - Scrollable */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="p-4 md:p-6 space-y-6">
//           {/* Stats Cards */}
//           {statsLoading ? (
//             <SkeletonStats />
//           ) : stats && (
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//               <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-green-700 font-medium">Total Payments</p>
//                     <p className="text-2xl font-bold text-green-800">
//                       {stats?.total || 0}
//                     </p>
//                   </div>
//                   <Wallet className="h-8 w-8 text-green-500 opacity-70" />
//                 </div>
//               </div>
              
//               <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-blue-700 font-medium">Total Amount</p>
//                     <p className="text-2xl font-bold text-blue-800">
//                       {paymentService.formatCurrency(stats?.totalAmount || 0)}
//                     </p>
//                   </div>
//                   <TrendingUp className="h-8 w-8 text-blue-500 opacity-70" />
//                 </div>
//               </div>
              
//               <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-yellow-700 font-medium">Today's Payments</p>
//                     <p className="text-2xl font-bold text-yellow-800">
//                       {paymentService.formatCurrency(stats?.todayAmount || 0)}
//                     </p>
//                   </div>
//                   <Calendar className="h-8 w-8 text-yellow-500 opacity-70" />
//                 </div>
//               </div>
              
//               <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-purple-700 font-medium">Average Payment</p>
//                     <p className="text-2xl font-bold text-purple-800">
//                       {paymentService.formatCurrency(stats?.averagePayment || 0)}
//                     </p>
//                   </div>
//                   <CreditCard className="h-8 w-8 text-purple-500 opacity-70" />
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Main Table Container */}
//           <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//             {/* Filters - Fixed */}
//             <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50 flex-shrink-0">
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search payments..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                     disabled={loading}
//                   />
//                 </div>
                
//                 <select
//                   value={filterMethod}
//                   onChange={(e) => setFilterMethod(e.target.value)}
//                   className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                   disabled={loading}
//                 >
//                   <option value="all">All Methods</option>
//                   {methods.map(method => (
//                     <option key={method} value={method}>
//                       {paymentService.formatMethodName(method)}
//                     </option>
//                   ))}
//                 </select>
                
//                 <select
//                   value={filterStatus}
//                   onChange={(e) => setFilterStatus(e.target.value)}
//                   className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                   disabled={loading}
//                 >
//                   <option value="all">All Status</option>
//                   {statuses.map(status => (
//                     <option key={status} value={status}>
//                       {paymentService.formatStatusName(status)}
//                     </option>
//                   ))}
//                 </select>
                
//                 <button
//                   onClick={() => {
//                     setSearchTerm('');
//                     setFilterMethod('all');
//                     setFilterStatus('all');
//                   }}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                   disabled={loading}
//                 >
//                   Clear Filters
//                 </button>
//               </div>
//             </div>

//             {/* Payments Table - Scrollable */}
//             <div className="p-6 flex-1 overflow-y-auto">
//               {loading ? (
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Payment Details
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Amount & Method
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Status & Balance
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Date
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Actions
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {[1, 2, 3, 4, 5].map((i) => (
//                         <SkeletonRow key={i} />
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : filteredPayments.length === 0 ? (
//                 <div className="text-center py-12">
//                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
//                     <Wallet className="h-8 w-8 text-gray-600" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-800 mb-2">No payments found</h3>
//                   <p className="text-gray-500 mb-6">Create your first payment</p>
//                   <button
//                     onClick={() => setShowCreateModal(true)}
//                     className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 font-medium inline-flex items-center gap-2"
//                   >
//                     <Plus className="h-5 w-5" />
//                     Record New Payment
//                   </button>
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Payment Details
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Amount & Method
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Status & Balance
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Date
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Actions
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {filteredPayments.map((payment) => (
//                         <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
//                           <td className="px-6 py-4">
//                             <div>
//                               <div className="flex items-center gap-2">
//                                 <Receipt className="h-5 w-5 text-green-500" />
//                                 <div>
//                                   <div className="font-medium text-gray-900">
//                                     {payment.receiptNumber}
//                                   </div>
//                                   <div className="text-sm text-gray-500 flex items-center gap-1">
//                                     <CreditCard className="h-3 w-3" />
//                                     Invoice: {payment.invoiceId.substring(0, 8)}...
//                                   </div>
//                                   {payment.referenceNumber && (
//                                     <div className="text-xs text-gray-400 mt-1">
//                                       Ref: {payment.referenceNumber}
//                                     </div>
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4">
//                             <div className="space-y-1">
//                               <div className="text-lg font-semibold text-gray-900">
//                                 {paymentService.formatCurrency(payment.amountPaid)}
//                               </div>
//                               <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentService.getMethodColor(payment.method)}`}>
//                                 {paymentService.formatMethodName(payment.method)}
//                               </span>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4">
//                             <div className="space-y-1">
//                               <div className="flex items-center gap-2">
//                                 {payment.status === 'completed' && (
//                                   <CheckCircle className="h-4 w-4 text-green-600" />
//                                 )}
//                                 {payment.status === 'pending' && (
//                                   <Clock className="h-4 w-4 text-yellow-600" />
//                                 )}
//                                 {payment.status === 'failed' && (
//                                   <XCircle className="h-4 w-4 text-red-600" />
//                                 )}
//                                 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentService.getStatusColor(payment.status)}`}>
//                                   {paymentService.formatStatusName(payment.status)}
//                                 </span>
//                               </div>
//                               <div className="text-sm text-gray-500">
//                                 Balance: {paymentService.formatCurrency(payment.balanceRemaining)}
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4">
//                             <div className="text-sm text-gray-900">
//                               <div className="flex items-center gap-1">
//                                 <Calendar className="h-3 w-3 text-gray-400" />
//                                 {paymentService.formatDate(payment.paymentDate)}
//                               </div>
//                               <div className="text-xs text-gray-500 mt-1">
//                                 {new Date(payment.createdAt).toLocaleDateString()}
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4">
//                             <div className="flex items-center gap-2">
//                               <button
//                                 onClick={() => setShowDetailModal(payment)}
//                                 className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                                 title="View Details"
//                               >
//                                 <Eye className="h-4 w-4" />
//                               </button>
                              
//                               {payment.status === 'pending' && (
//                                 <button
//                                   onClick={() => handleReconcilePayment(payment)}
//                                   className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                                   title="Reconcile Payment"
//                                 >
//                                   <CheckCircle className="h-4 w-4" />
//                                 </button>
//                               )}
                              
//                               <button
//                                 onClick={() => handleExportReceipt(payment)}
//                                 className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
//                                 title="Export Receipt"
//                               >
//                                 <Download className="h-4 w-4" />
//                               </button>
                              
//                               {payment.status === 'completed' && (
//                                 <button
//                                   onClick={() => handleRefundPayment(payment)}
//                                   className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
//                                   title="Refund Payment"
//                                 >
//                                   <RefreshCw className="h-4 w-4" />
//                                 </button>
//                               )}
                              
//                               <button
//                                 onClick={() => router.push(`/payments/details?id=${payment.id}`)}
//                                 className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
//                                 title="Edit Payment"
//                               >
//                                 <Edit className="h-4 w-4" />
//                               </button>
                              
//                               <button
//                                 onClick={() => handleDeletePayment(payment)}
//                                 className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                                 title="Delete Payment"
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Status Summary */}
//           {!statsLoading && stats?.byStatus && (
//             <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
//               <h3 className="font-semibold text-gray-800 mb-4">Payment Status Overview</h3>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//                 {stats.byStatus.map((status: any) => (
//                   <div
//                     key={status._id}
//                     className="p-3 rounded-xl bg-white border border-gray-200"
//                   >
//                     <div className="flex items-center gap-2 mb-1">
//                       <div className={`h-2 w-2 rounded-full ${
//                         status._id === 'completed' ? 'bg-green-400' :
//                         status._id === 'pending' ? 'bg-yellow-400' :
//                         status._id === 'failed' ? 'bg-red-400' :
//                         'bg-gray-400'
//                       }`} />
//                       <span className="text-sm font-medium text-gray-700 capitalize">
//                         {status._id}
//                       </span>
//                     </div>
//                     <div className="text-lg font-bold text-gray-800">{status.count}</div>
//                     <div className="text-xs text-gray-500">
//                       {paymentService.formatCurrency(status.totalAmount || 0)}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modals */}
//       <CreatePaymentModal
//         isOpen={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         onCreate={handleCreatePayment}
//       />
      
//       {showDetailModal && (
//         <PaymentDetailModal
//           payment={showDetailModal}
//           isOpen={!!showDetailModal}
//           onClose={() => setShowDetailModal(null)}
//           onExport={handleExportReceipt}
//           onReconcile={handleReconcilePayment}
//           onRefund={handleRefundPayment}
//         />
//       )}
//     </div>
//   );
// }