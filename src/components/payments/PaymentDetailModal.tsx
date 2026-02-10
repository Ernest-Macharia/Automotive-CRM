// 'use client';

// import { useState, useEffect } from 'react'; // Changed from useState import
// import {
//   X,
//   Download,
//   CheckCircle,
//   RefreshCw,
//   Calendar,
//   CreditCard,
//   Receipt,
//   Copy,
//   Printer,
//   Mail,
//   Wallet,
//   Building,
//   Smartphone
// } from 'lucide-react';
// import { Payment, paymentService } from '@/services/paymentService';
// import { invoiceService, Invoice } from '@/services/invoiceService';

// interface PaymentDetailModalProps {
//   payment: Payment;
//   isOpen: boolean;
//   onClose: () => void;
//   onExport: (payment: Payment) => Promise<void>;
//   onReconcile: (payment: Payment) => Promise<void>;
//   onRefund: (payment: Payment) => Promise<void>;
// }

// export default function PaymentDetailModal({
//   payment,
//   isOpen,
//   onClose,
//   onExport,
//   onReconcile,
//   onRefund
// }: PaymentDetailModalProps) {
//   const [loading, setLoading] = useState(false);
//   const [invoice, setInvoice] = useState<Invoice | null>(null);
//   const [copied, setCopied] = useState(false);

//   // Load invoice details - Fixed useEffect
//   useEffect(() => {
//     const loadInvoice = async () => {
//       try {
//         const inv = await invoiceService.getInvoiceById(payment.invoiceId);
//         setInvoice(inv);
//       } catch (error) {
//         console.error('Error loading invoice:', error);
//       }
//     };

//     if (isOpen && payment) {
//       loadInvoice();
//     }
//   }, [isOpen, payment]);

//   const handleCopyReference = () => {
//     navigator.clipboard.writeText(payment.referenceNumber);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   const handleSendEmail = () => {
//     const email = prompt('Enter recipient email:', 'customer@example.com');
//     if (email) {
//       alert(`Receipt sent to ${email}`);
//     }
//   };

//   const getMethodIcon = (method: string) => {
//     switch (method) {
//       case 'cash':
//         return <Wallet className="h-6 w-6" />;
//       case 'card':
//         return <CreditCard className="h-6 w-6" />;
//       case 'bank_transfer':
//         return <Building className="h-6 w-6" />;
//       case 'mobile_money':
//         return <Smartphone className="h-6 w-6" />;
//       case 'cheque':
//         return <Receipt className="h-6 w-6" />;
//       default:
//         return <CreditCard className="h-6 w-6" />;
//     }
//   };

//   // Helper to safely get the first color class
//   const getMethodColorClass = (method: string) => {
//     const colorClass = paymentService.getMethodColor(method);
//     return colorClass.split(' ')[0];
//   };

//   // Fix for the map function parameter type
//   const formatPaymentStatus = (status: string) => {
//     return status.split('_').map((word: string) => 
//       word.charAt(0).toUpperCase() + word.slice(1)
//     ).join(' ');
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex min-h-screen items-center justify-center p-4">
//         <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
//         <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl transform transition-all">
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 border-b border-gray-200">
//             <div className="flex items-center gap-3">
//               <div className={`p-2 rounded-lg ${
//                 payment.status === 'completed' 
//                   ? 'bg-green-100' 
//                   : payment.status === 'pending'
//                   ? 'bg-yellow-100'
//                   : 'bg-red-100'
//               }`}>
//                 <Receipt className="h-6 w-6 text-green-600" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
//                 <p className="text-sm text-gray-600">Receipt {payment.receiptNumber}</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             >
//               <X className="h-5 w-5" />
//             </button>
//           </div>

//           <div className="p-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Left Column - Payment Info */}
//               <div className="space-y-6">
//                 {/* Status Badge */}
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentService.getStatusColor(payment.status)}`}>
//                       {paymentService.formatStatusName(payment.status)}
//                     </span>
//                     {payment.status === 'completed' && (
//                       <CheckCircle className="h-5 w-5 text-green-500" />
//                     )}
//                   </div>
//                   <div className="text-sm text-gray-500">
//                     ID: {payment.id.substring(0, 8)}...
//                   </div>
//                 </div>

//                 {/* Amount Card */}
//                 <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
//                   <div className="text-center">
//                     <div className="text-sm text-green-700 font-medium mb-2">Amount Paid</div>
//                     <div className="text-3xl font-bold text-green-800 mb-1">
//                       {paymentService.formatCurrency(payment.amountPaid)}
//                     </div>
//                     <div className="text-sm text-green-600">
//                       Balance: {paymentService.formatCurrency(payment.balanceRemaining)}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Payment Method */}
//                 <div className="border border-gray-200 rounded-xl p-4">
//                   <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h3>
//                   <div className="flex items-center gap-3">
//                     <div className={`p-2 rounded-lg ${getMethodColorClass(payment.method)}`}>
//                       {getMethodIcon(payment.method)}
//                     </div>
//                     <div>
//                       <div className="font-medium text-gray-900">
//                         {paymentService.formatMethodName(payment.method)}
//                       </div>
//                       <div className="text-sm text-gray-500">
//                         Reference: {payment.referenceNumber}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Dates */}
//                 <div className="border border-gray-200 rounded-xl p-4">
//                   <h3 className="text-sm font-medium text-gray-700 mb-3">Dates</h3>
//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2 text-gray-600">
//                         <Calendar className="h-4 w-4" />
//                         <span>Payment Date</span>
//                       </div>
//                       <span className="font-medium">
//                         {paymentService.formatDate(payment.paymentDate)}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2 text-gray-600">
//                         <Calendar className="h-4 w-4" />
//                         <span>Recorded On</span>
//                       </div>
//                       <span className="font-medium">
//                         {paymentService.formatDate(payment.createdAt)}
//                       </span>
//                     </div>
//                     {payment.recordedBy && (
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2 text-gray-600">
//                           <Calendar className="h-4 w-4" />
//                           <span>Recorded By</span>
//                         </div>
//                         <span className="font-medium">{payment.recordedBy}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Right Column - Invoice & Actions */}
//               <div className="space-y-6">
//                 {/* Invoice Details */}
//                 {invoice && (
//                   <div className="border border-gray-200 rounded-xl p-4">
//                     <h3 className="text-sm font-medium text-gray-700 mb-3">Invoice Details</h3>
//                     <div className="space-y-3">
//                       <div className="flex items-center justify-between">
//                         <span className="text-gray-600">Invoice Number:</span>
//                         <span className="font-medium text-purple-600">{invoice.invoiceNumber}</span>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className="text-gray-600">Total Amount:</span>
//                         <span className="font-medium">{paymentService.formatCurrency(invoice.totalAmount)}</span>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className="text-gray-600">Balance Before:</span>
//                         <span className="font-medium text-red-600">
//                           {paymentService.formatCurrency(invoice.balance + payment.amountPaid)}
//                         </span>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className="text-gray-600">Balance After:</span>
//                         <span className="font-medium text-green-600">
//                           {paymentService.formatCurrency(invoice.balance)}
//                         </span>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className="text-gray-600">Status:</span>
//                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//                           invoice.paymentStatus === 'paid' 
//                             ? 'bg-green-100 text-green-800'
//                             : invoice.paymentStatus === 'partially_paid'
//                             ? 'bg-yellow-100 text-yellow-800'
//                             : 'bg-blue-100 text-blue-800'
//                         }`}>
//                           {formatPaymentStatus(invoice.paymentStatus)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Notes */}
//                 {payment.notes && (
//                   <div className="border border-gray-200 rounded-xl p-4">
//                     <h3 className="text-sm font-medium text-gray-700 mb-3">Notes</h3>
//                     <p className="text-sm text-gray-600">{payment.notes}</p>
//                   </div>
//                 )}

//                 {/* Actions */}
//                 <div className="border border-gray-200 rounded-xl p-4">
//                   <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
//                   <div className="grid grid-cols-2 gap-3">
//                     <button
//                       onClick={() => onExport(payment)}
//                       className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                     >
//                       <Download className="h-4 w-4" />
//                       <span className="text-sm font-medium">Export PDF</span>
//                     </button>
                    
//                     <button
//                       onClick={handlePrint}
//                       className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                     >
//                       <Printer className="h-4 w-4" />
//                       <span className="text-sm font-medium">Print</span>
//                     </button>
                    
//                     <button
//                       onClick={handleCopyReference}
//                       className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                     >
//                       <Copy className="h-4 w-4" />
//                       <span className="text-sm font-medium">
//                         {copied ? 'Copied!' : 'Copy Ref'}
//                       </span>
//                     </button>
                    
//                     <button
//                       onClick={handleSendEmail}
//                       className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                     >
//                       <Mail className="h-4 w-4" />
//                       <span className="text-sm font-medium">Email</span>
//                     </button>
//                   </div>

//                   {/* Status Actions */}
//                   <div className="mt-4 pt-4 border-t border-gray-200">
//                     {payment.status === 'pending' && (
//                       <button
//                         onClick={() => onReconcile(payment)}
//                         className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                       >
//                         <CheckCircle className="h-4 w-4" />
//                         <span className="font-medium">Mark as Completed</span>
//                       </button>
//                     )}
                    
//                     {payment.status === 'completed' && (
//                       <button
//                         onClick={() => onRefund(payment)}
//                         className="w-full flex items-center justify-center gap-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
//                       >
//                         <RefreshCw className="h-4 w-4" />
//                         <span className="font-medium">Process Refund</span>
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
//             <div className="text-sm text-gray-600">
//               Last updated: {paymentService.formatDate(payment.updatedAt)}
//             </div>
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={onClose}
//                 className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }