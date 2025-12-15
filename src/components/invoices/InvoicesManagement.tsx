'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Mail,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  CreditCard,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { invoiceService, Invoice, InvoicesResponse } from '@/services/invoiceService';
import CreateInvoiceModal from './CreateInvoiceModal';
import AddPaymentModal from './AddPaymentModal';

export default function InvoicesManagement() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showOverdue, setShowOverdue] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const statuses = ['draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'];

  useEffect(() => {
    loadInvoices();
    loadStats();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (showOverdue) params.overdue = true;
      
      const response = await invoiceService.getAllInvoices(params);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await invoiceService.getInvoiceStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading invoice stats:', error);
    }
  };

  const handleCreateInvoice = async (data: any) => {
    try {
      const newInvoice = await invoiceService.createInvoice(data);
      setInvoices(prev => [newInvoice, ...prev]);
      showToast('Invoice created successfully', 'success');
      setShowCreateModal(false);
      loadStats();
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast('Failed to create invoice', 'error');
    }
  };

  const handleAddPayment = async (invoiceId: string, data: any) => {
    try {
      const updatedInvoice = await invoiceService.addPayment(invoiceId, data);
      setInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInvoice : i));
      showToast('Payment added successfully', 'success');
      setShowAddPaymentModal(null);
      loadStats();
    } catch (error) {
      console.error('Error adding payment:', error);
      showToast('Failed to add payment', 'error');
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await invoiceService.deleteInvoice(invoice.id);
      setInvoices(prev => prev.filter(i => i.id !== invoice.id));
      showToast('Invoice deleted successfully', 'success');
      loadStats();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showToast('Failed to delete invoice', 'error');
    }
  };

  const handleExportPDF = async (invoice: Invoice) => {
    try {
      const blob = await invoiceService.exportInvoiceToPDF(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
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

  const handleSendEmail = async (invoice: Invoice) => {
    const email = prompt('Enter recipient email:', 'customer@example.com');
    if (!email) return;
    
    try {
      await invoiceService.sendInvoiceEmail(invoice.id, {
        to: email,
        subject: `Invoice ${invoice.invoiceNumber}`,
        message: `Please find attached invoice ${invoice.invoiceNumber}`
      });
      showToast('Email sent successfully', 'success');
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email', 'error');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.paymentStatus === filterStatus;
    
    const isOverdue = invoiceService.isOverdue(invoice.dueDate);
    const matchesOverdue = !showOverdue || (showOverdue && isOverdue);
    
    return matchesSearch && matchesStatus && matchesOverdue;
  });

  const getStatusColor = (status: string, dueDate?: string) => {
    if (status === 'overdue' || (dueDate && invoiceService.isOverdue(dueDate))) {
      return 'bg-red-100 text-red-800';
    }
    
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string, dueDate?: string) => {
    if (status === 'overdue' || (dueDate && invoiceService.isOverdue(dueDate))) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partially_paid':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Receipt className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-purple-500" />
            Invoices Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create, manage, and track invoices and payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadInvoices()}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Total Invoices</p>
              <p className="text-2xl font-bold text-purple-800">
                {stats?.total || 0}
              </p>
            </div>
            <Receipt className="h-8 w-8 text-purple-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Paid Amount</p>
              <p className="text-2xl font-bold text-green-800">
                {invoiceService.formatCurrency(stats?.paidAmount || 0)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Outstanding</p>
              <p className="text-2xl font-bold text-red-800">
                {invoiceService.formatCurrency(stats?.outstandingAmount || 0)}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-orange-800">
                {invoiceService.formatCurrency(stats?.overdueAmount || 0)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500 opacity-70" />
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
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showOverdue"
              checked={showOverdue}
              onChange={(e) => setShowOverdue(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="showOverdue" className="text-sm text-gray-700">
              Show Overdue Only
            </label>
          </div>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setShowOverdue(false);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount & Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const isOverdue = invoiceService.isOverdue(invoice.dueDate);
                  const daysUntilDue = invoiceService.daysUntilDue(invoice.dueDate);
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-purple-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {invoice.invoiceNumber}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Opportunity: {invoice.opportunityId.substring(0, 8)}...
                              </div>
                              {invoice.quoteId && (
                                <div className="text-xs text-blue-600 mt-1">
                                  From Quote: {invoice.quoteId.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-gray-900">
                            {invoiceService.formatCurrency(invoice.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Paid: {invoiceService.formatCurrency(invoice.paidAmount)}
                          </div>
                          {invoice.balance > 0 && (
                            <div className="text-sm font-medium text-red-600">
                              Balance: {invoiceService.formatCurrency(invoice.balance)}
                            </div>
                          )}
                          {invoice.payments.length > 0 && (
                            <div className="text-xs text-gray-400">
                              {invoice.payments.length} payment{invoice.payments.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invoice.paymentStatus, invoice.dueDate)}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusColor(invoice.paymentStatus, invoice.dueDate)
                            }`}>
                              {invoice.paymentStatus.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                              {isOverdue && ' (Overdue)'}
                            </span>
                          </div>
                          {!isOverdue && daysUntilDue >= 0 && (
                            <div className="text-xs text-gray-500">
                              Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                            </div>
                          )}
                          {isOverdue && (
                            <div className="text-xs text-red-500">
                              Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            Issued: {invoiceService.formatDate(invoice.issueDate)}
                          </div>
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            Due: {invoiceService.formatDate(invoice.dueDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/invoices/${invoice.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {invoice.balance > 0 && (
                            <button
                              onClick={() => setShowAddPaymentModal(invoice)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Add Payment"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleExportPDF(invoice)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Export PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleSendEmail(invoice)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateInvoice}
      />
      
      {showAddPaymentModal && (
        <AddPaymentModal
          invoice={showAddPaymentModal}
          isOpen={!!showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(null)}
          onAddPayment={handleAddPayment}
        />
      )}
    </div>
  );
}