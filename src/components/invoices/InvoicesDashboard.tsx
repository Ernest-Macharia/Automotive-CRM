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
  Search,
  Filter,
  Eye,
  CreditCard,
  Trash2,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { invoiceService, Invoice } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function InvoicesDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    outstanding: 0
  });

  const statusOptions = [
    { value: 'all', label: 'All Invoices', color: 'text-gray-600' },
    { value: 'draft', label: 'Draft', color: 'text-gray-500' },
    { value: 'pending', label: 'Pending', color: 'text-blue-600' },
    { value: 'partially_paid', label: 'Partially Paid', color: 'text-yellow-600' },
    { value: 'paid', label: 'Paid', color: 'text-green-600' },
    { value: 'overdue', label: 'Overdue', color: 'text-red-600' },
  ];

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoicesData = await invoiceService.getAllInvoices();
      setInvoices(invoicesData);
      updateStats(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (invoicesData: Invoice[]) => {
    const total = invoicesData.length;
    const paid = invoicesData.filter(i => i.paymentStatus === 'paid').length;
    const pending = invoicesData.filter(i => i.paymentStatus === 'pending').length;
    const overdue = invoicesData.filter(i => 
      invoiceService.isOverdue(i.dueDate) && i.paymentStatus !== 'paid'
    ).length;
    const totalAmount = invoicesData.reduce((sum, i) => sum + i.totalAmount, 0);
    const outstanding = invoicesData.reduce((sum, i) => sum + i.balance, 0);
    
    setStats({ total, paid, pending, overdue, totalAmount, outstanding });
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await invoiceService.deleteInvoice(invoiceId);
      showToast('Invoice deleted successfully', 'success');
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showToast('Failed to delete invoice', 'error');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (invoice: Invoice) => {
    if (invoiceService.isOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid') {
      return 'bg-gradient-to-r from-red-500 to-pink-500';
    }
    
    switch (invoice.paymentStatus) {
      case 'paid': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'partially_paid': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'pending': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'draft': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500';
    }
  };

  const getStatusIcon = (invoice: Invoice) => {
    if (invoiceService.isOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid') {
      return <AlertCircle className="h-4 w-4" />;
    }
    
    switch (invoice.paymentStatus) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'partially_paid': return <Clock className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

    const handleExportPDF = async (invoiceId: string) => {
        try {
            const blob = await invoiceService.exportInvoiceToPDF(invoiceId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
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

    const handleSendEmail = async (invoiceId: string) => {
        const email = prompt('Enter recipient email:', 'customer@example.com');
        if (!email) return;
        
        try {
            await invoiceService.sendInvoiceEmail(invoiceId, {
            to: email,
            subject: 'Invoice Details',
            message: 'Please find attached invoice details.'
            });
            showToast('Email sent successfully', 'success');
        } catch (error) {
            console.error('Error sending email:', error);
            showToast('Failed to send email', 'error');
        }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Receipt className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Invoices Management</h1>
                <p className="text-purple-100">Create, manage, and track customer invoices</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadInvoices}
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link
                href="/invoices/create"
                className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                New Invoice
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-8 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+8% this month</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.paid}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-green-200">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {invoiceService.formatCurrency(stats.outstanding)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-200">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-100 to-red-200">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Total Revenue</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {invoiceService.formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-white">
                <ArrowUpRight className="h-4 w-4" />
                <span>+15.3% from last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices by number or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value} className={option.color}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount & Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="text-gray-600">Loading invoices...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Receipt className="h-12 w-12 text-gray-400" />
                        <div>
                          <p className="text-gray-900 font-medium">No invoices found</p>
                          <p className="text-gray-600 mt-1">
                            {searchTerm || filterStatus !== 'all' 
                              ? 'Try changing your search or filters' 
                              : 'Create your first invoice to get started'}
                          </p>
                        </div>
                        <Link
                          href="/invoices/create"
                          className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all"
                        >
                          Create New Invoice
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const isOverdue = invoiceService.isOverdue(invoice.dueDate) && invoice.paymentStatus !== 'paid';
                    const daysUntilDue = invoiceService.daysUntilDue(invoice.dueDate);
                    
                    return (
                      <tr 
                        key={invoice.id} 
                        className="hover:bg-gray-50/50 transition-all duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${getStatusColor(invoice)}`}>
                              {getStatusIcon(invoice)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/invoices/${invoice.id}`}
                                  className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                                >
                                  {invoice.invoiceNumber}
                                </Link>
                                {invoice.quoteId && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    From Quote
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Opportunity: {invoice.opportunityId.substring(0, 10)}...
                              </div>
                              {invoice.notes && (
                                <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                  {invoice.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-gray-900">
                              {invoiceService.formatCurrency(invoice.totalAmount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Paid: {invoiceService.formatCurrency(invoice.paidAmount)}
                            </div>
                            {invoice.balance > 0 && (
                              <div className="text-sm font-medium text-red-600">
                                Balance: {invoiceService.formatCurrency(invoice.balance)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(invoice)} text-white`}>
                              {getStatusIcon(invoice)}
                              {invoice.paymentStatus.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                              {isOverdue && ' (Overdue)'}
                            </span>
                            {!isOverdue && daysUntilDue >= 0 && (
                              <div className="text-xs text-gray-600">
                                Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                              </div>
                            )}
                            {isOverdue && (
                              <div className="text-xs text-red-600">
                                Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">
                              Issued: {invoiceService.formatDate(invoice.issueDate)}
                            </div>
                            <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              Due: {invoiceService.formatDate(invoice.dueDate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            
                            {invoice.balance > 0 && (
                              <Link
                                href={`/invoices/${invoice.id}/pay`}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title="Record Payment"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Link>
                            )}
                            
                            <button
                              onClick={() => handleExportPDF(invoice.id)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleSendEmail(invoice.id)}
                              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            
                            <Link
                              href={`/invoices/${invoice.id}/edit`}
                              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                              title="Edit Invoice"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                            
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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
      </div>
    </div>
  );
}