'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  CircleDot,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Printer,
  Receipt,
  RefreshCw,
  Share2,
  Link as LinkIcon,
  Download,
  Edit,
  AlertCircle,
  Package,
  History,
  MessageSquare,
  Archive,
  Truck,
  Copy,
  Send,
  PackageCheck,
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
} from 'lucide-react';

import { salesOrderService } from '@/services/salesOrderService';
import { quoteService } from '@/services/quoteService';
import { invoiceService } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';

interface SalesOrderDetailPageProps {
  orderId: string;
}

type TabId = 'overview' | 'quotation' | 'invoice' | 'items' | 'documents' | 'activity' | 'notes';

type StageName = 'quote' | 'invoice';

type WorkflowStage = {
  stage: StageName;
  label: string;
  description?: string;
  completed: boolean;
  isCurrent: boolean;
  document?: any;
  documentId?: string;
  documentType?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return '—';
  }
};

const getOpportunityId = (order: any): string | null => {
  if (!order?.opportunityId) return null;
  return typeof order.opportunityId === 'object' ? order.opportunityId._id : order.opportunityId;
};

const getId = (maybeObj: any) => (typeof maybeObj === 'object' ? maybeObj?._id : maybeObj);

const getQuoteIdFromOrder = (order: any): string | null => {
  const id = getId(order?.quoteId);
  return id || null;
};

const getInvoiceIdFromOrder = (order: any): string | null => {
  const id = getId(order?.invoiceId);
  return id || null;
};

const getOrderStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered': return 'text-green-700';
    case 'shipped': return 'text-purple-700';
    case 'processing': return 'text-yellow-700';
    case 'confirmed': return 'text-blue-700';
    case 'draft': return 'text-gray-700';
    case 'cancelled': return 'text-red-700';
    default: return 'text-gray-900';
  }
};

function StagePill({ stage }: { stage: WorkflowStage }) {
  const status =
    stage.completed ? 'Completed' : stage.isCurrent ? 'In progress' : 'Pending';
  const cls = stage.completed
    ? 'bg-green-100 text-green-800'
    : stage.isCurrent
      ? 'bg-blue-100 text-blue-800'
      : 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function StageDot({ stage }: { stage: WorkflowStage }) {
  if (stage.completed) return <CheckCircle className="h-5 w-5 text-green-600" />;
  if (stage.isCurrent) return <CircleDot className="h-5 w-5 text-blue-600" />;
  return <Circle className="h-5 w-5 text-gray-400" />;
}

/**
 * ✅ Rewritten Sales Order Detail page
 * - Strictly follows backend lifecycle: Sales Order packageType uses stages ['quote','invoice']
 * - Seamless CTA: "Accept Quote & Generate Invoice"
 *   1) Approve quote
 *   2) Transition lifecycle quote → invoice (backend creates invoice from quote)
 *   3) Poll until invoiceId exists, then switch to Invoice tab
 * - Stage completion rules aligned with backend intent:
 *   - quote completed = quote.status === 'approved'
 *   - invoice completed = invoice exists (payment is a status inside invoice, not stage completion)
 */
export default function SalesOrderDetailPage({ orderId }: SalesOrderDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [lifecycle, setLifecycle] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Optional placeholders (your existing code had these)
  const [activityLog] = useState<any[]>([]);
  const [attachments] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const order = await salesOrderService.getSalesOrderById(orderId);
      setSalesOrder(order);
      
      // Remove lifecycle integration code
      // const opportunityId = getOpportunityId(order);
      // if (opportunityId) {
      //   const lifecycleUI = await lifecycleIntegrationService.getSalesOrderLifecycleUI(opportunityId);
      //   setLifecycle(lifecycleUI);
      // }
    } catch (e) {
      console.error(e);
      showToast('Failed to load sales order details', 'error');
      router.push('/orders/sales-orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, router, showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  

  const stages = useMemo(() => {
    const q = salesOrder?.quoteId;
    const inv = salesOrder?.invoiceId;
    const quoteApproved = typeof q === 'object' ? q?.status === 'approved' : false;
    const invoiceExists = !!inv;
    const invoicePaid = typeof inv === 'object' ? inv?.status === 'paid' : false;
    const salesOrderCompleted = salesOrder?.status === 'delivered';
    
    return [
      {
        stage: 'quote' as const,
        label: 'Quote',
        description: 'Approve the quotation',
        completed: quoteApproved,
        isCurrent: !quoteApproved, // Current only if not approved yet
        document: typeof q === 'object' ? q : undefined,
        documentId: getId(q),
        documentType: 'Quote',
      },
      {
        stage: 'invoice' as const,
        label: 'Invoice',
        description: invoicePaid 
          ? 'Payment received ✓' 
          : invoiceExists
            ? 'Invoice ready for payment'
            : 'Generated from approved quote',
        completed: invoicePaid || salesOrderCompleted,
        isCurrent: quoteApproved && !invoicePaid, // Current if quote approved but invoice not paid
        document: typeof inv === 'object' ? inv : undefined,
        documentId: getId(inv),
        documentType: 'Invoice',
      },
    ];
  }, [salesOrder]);

  const currentStage = useMemo(() => stages.find((s) => s.isCurrent) || stages[0], [stages]);

  const quoteId = useMemo(() => getQuoteIdFromOrder(salesOrder), [salesOrder]);
  const invoiceId = useMemo(() => getInvoiceIdFromOrder(salesOrder), [salesOrder]);

  const quoteStatus = useMemo(() => {
    if (!salesOrder?.quoteId) return '—';
    return typeof salesOrder.quoteId === 'object' ? salesOrder.quoteId.status : 'pending';
  }, [salesOrder?.quoteId]);

  const invoiceStatus = useMemo(() => {
    if (!salesOrder?.invoiceId) return '—';
    return typeof salesOrder.invoiceId === 'object' ? salesOrder.invoiceId.status : 'draft';
  }, [salesOrder?.invoiceId]);

  const handleAcceptQuoteAndGenerateInvoice = useCallback(async () => {
    if (!salesOrder) return;

    setBusy(true);
    try {
      const quoteId = getQuoteIdFromOrder(salesOrder);
      if (!quoteId) {
        showToast('No quote found for this sales order', 'error');
        return;
      }

      // Approve quote if needed
      const quote = await quoteService.getQuoteById(quoteId);
      if (quote.status !== 'approved') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id || 'system';
        const userRole = user.role || 'user';
        
        await quoteService.approveQuote(quoteId, userId, userRole);
        showToast('Quote approved successfully', 'success');
      }

      showToast('Creating invoice from quote...', 'info');
      
      // Create invoice - returns direct Invoice object
      const invoiceResult = await invoiceService.createInvoiceFromQuote(quoteId);
      
      // Extract invoice ID safely
      let invoiceId: string;
      if (invoiceResult && (invoiceResult._id || invoiceResult.id)) {
        // Direct Invoice object
        invoiceId = invoiceResult._id || invoiceResult.id;
      } else {
        throw new Error('Invalid invoice response structure');
      }

      // Update sales order
      const updatedOrder = await salesOrderService.updateSalesOrder(
        salesOrder._id || salesOrder.id,
        { invoiceId }
      );
      
      setSalesOrder(updatedOrder);
      showToast('Invoice created successfully!', 'success');
      
      // Try to send email
      try {
        await invoiceService.sendInvoiceEmail(invoiceId);
        showToast('Invoice sent to customer', 'info');
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }
      
      // Switch to invoice tab
      setActiveTab('invoice');
      
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      showToast(
        error?.message || 'Failed to generate invoice from quote', 
        'error'
      );
    } finally {
      setBusy(false);
    }
  }, [salesOrder, showToast]);

  const updateSalesOrderToDelivered = useCallback(async () => {
    if (!salesOrder) return;
    
    try {
      const updatedOrder = await salesOrderService.updateSalesOrder(
        salesOrder._id || salesOrder.id,
        {
          status: 'delivered',
          actualDeliveryDate: new Date().toISOString()
        }
      );
      
      setSalesOrder(updatedOrder);
      showToast('Sales order marked as delivered!', 'success');
      
      // Refresh to show updated state
      setTimeout(() => {
        fetchAll();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating sales order:', error);
      showToast('Failed to update sales order status', 'error');
    }
  }, [salesOrder, showToast, fetchAll]);

  const handleMarkInvoiceAsPaid = useCallback(async () => {
    if (!invoiceId) return;

    setBusy(true);
    try {
      // 1. Mark invoice as paid
      await invoiceService.markInvoiceAsPaid(
        invoiceId,
        JSON.parse(localStorage.getItem('user') || '{}')?._id || 'system',
        JSON.parse(localStorage.getItem('user') || '{}')?.role || 'user',
        'cash', // Or get from UI
        `Payment for sales order ${salesOrder?.salesOrderNumber || ''}`
      );

      // 2. Update sales order status to delivered
      await updateSalesOrderToDelivered();
      
      showToast('Invoice marked as paid and sales order completed!', 'success');
      
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      showToast(
        error?.message || 'Failed to mark invoice as paid', 
        'error'
      );
    } finally {
      setBusy(false);
    }
  }, [invoiceId, salesOrder, updateSalesOrderToDelivered, showToast]);

  useEffect(() => {
    const checkForUpdates = async () => {
      if (salesOrder && !salesOrder.invoiceId && currentStage?.stage === 'invoice') {
        // If we're in invoice stage but no invoice ID, check if one was created
        const refreshed = await salesOrderService.getSalesOrderById(orderId);
        const newInvoiceId = getInvoiceIdFromOrder(refreshed);
        
        if (newInvoiceId && !salesOrder.invoiceId) {
          setSalesOrder(refreshed);
          showToast('Invoice has been created!', 'success');
        }
      }
    };

    // Check every 5 seconds if we're waiting for invoice
    const interval = setInterval(checkForUpdates, 5000);
    
    return () => clearInterval(interval);
  }, [salesOrder, currentStage, orderId, showToast]);

  const handlePrint = async () => {
    try {
      setBusy(true);
      await sleep(500);
      window.print();
      showToast('Printing…', 'info');
    } catch {
      showToast('Failed to print', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async (method: 'email' | 'link' | 'download') => {
    try {
      setShowShareMenu(false);
      if (method === 'link') {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard', 'success');
        return;
      }
      if (method === 'download') {
        showToast('Export not implemented in this page yet', 'info');
        return;
      }
      showToast('Share via email (not implemented)', 'info');
    } catch {
      showToast('Share failed', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await salesOrderService.updateSalesOrder(orderId, { status: newStatus as any });
      showToast(`Status changed to ${newStatus}`, 'success');
      await fetchAll();
    } catch (e) {
      console.error(e);
      showToast('Failed to update status', 'error');
    }
  };

  const getInvoiceStatusText = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'Draft';
      case 'sent': return 'Sent';
      case 'paid': return 'Paid ✓';
      case 'overdue': return 'Overdue';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  };

  const getInvoiceStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'text-gray-700 bg-gray-100';
      case 'sent': return 'text-blue-700 bg-blue-100';
      case 'paid': return 'text-green-700 bg-green-100';
      case 'overdue': return 'text-red-700 bg-red-100';
      case 'cancelled': return 'text-gray-700 bg-gray-100';
      default: return 'text-yellow-700 bg-yellow-100';
    }
  };

  const getInvoiceStatusIcon = (status: string): React.ReactNode => {
    switch (status?.toLowerCase()) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading sales order…
        </div>
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Order Not Found</h3>
          <p className="text-gray-600 mb-6">The sales order doesn’t exist or has been removed.</p>
          <button
            onClick={() => router.push('/orders/sales-orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sales Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-4 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/orders/sales-orders')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Receipt className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-white">{salesOrder.salesOrderNumber}</h1>
                    <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white capitalize">
                      {String(salesOrder.status || 'draft').replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-white/90">
                    Sales Order • Created {formatDate(salesOrder.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={busy}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors disabled:opacity-50"
                title="Print"
              >
                {busy ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Printer className="h-5 w-5 text-white" />}
              </button>

              <button
                onClick={() => showToast('Export not implemented in this page yet', 'info')}
                disabled={busy}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors disabled:opacity-50"
                title="Export"
              >
                <Download className="h-5 w-5 text-white" />
              </button>

              <Link
                href={`/orders/sales-orders/${salesOrder._id}/edit`}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>

              <button
                onClick={() => setShowShareMenu((v) => !v)}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors relative"
                title="Share"
              >
                <Share2 className="h-5 w-5 text-white" />
                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleShare('email')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Share via Email
                    </button>
                    <button
                      onClick={() => handleShare('link')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleShare('download')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                )}
              </button>

              <button
                onClick={() => setShowActionsMenu((v) => !v)}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors relative"
                title="More actions"
              >
                <MoreVertical className="h-5 w-5 text-white" />
                {showActionsMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleStatusChange('delivered')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Mark as Delivered
                    </button>
                    <button
                      onClick={() => handleStatusChange('shipped')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Truck className="h-4 w-4 text-purple-600" />
                      Mark as Shipped
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={() => router.push(`/orders/sales-orders/${salesOrder._id}/duplicate`)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate Order
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={() => router.push(`/orders/sales-orders/${salesOrder._id}/archive`)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Archive Order
                    </button>
                  </div>
                )}
              </button>

              <button
                onClick={() => fetchAll()}
                disabled={busy}
                className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 text-white ${busy ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: <Receipt className="h-4 w-4" /> },
              { id: 'quotation', label: 'Quotation', icon: <FileText className="h-4 w-4" /> },
              { id: 'invoice', label: 'Invoice', icon: <Receipt className="h-4 w-4" /> },
              { id: 'items', label: 'Items', icon: <Package className="h-4 w-4" /> },
              { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
              { id: 'activity', label: 'Activity', icon: <History className="h-4 w-4" /> },
              { id: 'notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current stage focus */}
            {currentStage && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      salesOrder.status === 'delivered' 
                        ? 'bg-green-100' 
                        : currentStage.stage === 'quote' 
                          ? 'bg-blue-100' 
                          : 'bg-indigo-100'
                    }`}>
                      {salesOrder.status === 'delivered' ? (
                        <PackageCheck className="h-6 w-6 text-green-700" />
                      ) : currentStage.stage === 'quote' ? (
                        <FileText className="h-6 w-6 text-blue-700" />
                      ) : (
                        <Receipt className="h-6 w-6 text-indigo-700" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {salesOrder.status === 'delivered' 
                            ? 'Sales Order Completed' 
                            : currentStage.label}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          currentStage.completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {currentStage.completed ? '✓ Completed' : 'Current Step'}
                        </span>
                      </div>

                      <p className="text-gray-600">
                        {salesOrder.status === 'delivered' 
                          ? 'The sales order has been completed and delivered to the customer.'
                          : currentStage.stage === 'quote'
                            ? 'Approve the quote to generate the invoice.'
                            : invoiceStatus === 'paid'
                              ? 'Invoice has been paid. Complete the sales order.'
                              : 'Invoice is ready. View it or mark as paid.'}
                      </p>
                    </div>
                  </div>

                  {/* Primary CTA - Direct actions */}
                  <div className="flex items-center gap-2">
                    {salesOrder.status === 'delivered' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Sales Order Completed</span>
                        </div>
                        {invoiceId && (
                          <Link
                            href={`/invoices/${invoiceId}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            View Invoice
                          </Link>
                        )}
                      </div>
                    ) : currentStage.stage === 'quote' ? (
                      <button
                        onClick={handleAcceptQuoteAndGenerateInvoice}
                        disabled={busy || quoteStatus === 'approved'}
                        className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : quoteStatus === 'approved' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {quoteStatus === 'approved' 
                          ? 'Generate Invoice' 
                          : busy 
                            ? 'Processing…' 
                            : 'Approve Quote & Generate Invoice'}
                      </button>
                    ) : currentStage.stage === 'invoice' && invoiceId ? (
                      <>
                        <Link
                          href={`/invoices/${invoiceId}`}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Invoice
                        </Link>
                        
                        {invoiceStatus !== 'paid' ? (
                          <button
                            onClick={handleMarkInvoiceAsPaid}
                            disabled={busy}
                            className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                            Mark as Paid
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg">
                            <PackageCheck className="h-5 w-5" />
                            <span className="font-medium">Invoice Paid</span>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Workflow progress (2-step timeline) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Workflow</h3>
                  <p className="text-sm text-gray-600">Sales Order lifecycle: Quote → Invoice</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Stage</p>
                  <p className="text-lg font-semibold text-blue-700 capitalize">
                    {quoteStatus === 'approved' && currentStage?.stage === 'quote' 
                      ? 'Quote Completed' 
                      : currentStage?.stage}
                  </p>
                  {quoteStatus === 'approved' && currentStage?.stage === 'quote' && (
                    <p className="text-xs text-green-600">✓ Ready for invoice</p>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-6 right-6 top-6 h-0.5 bg-gray-200" />
                <div className="relative flex justify-between">
                  {stages.map((s) => (
                    <div key={s.stage} className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                          s.completed
                            ? 'bg-green-50 border-green-500'
                            : s.isCurrent
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        {s.completed ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : s.isCurrent ? (
                          <CircleDot className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {s.stage === 'quote' && quoteStatus === 'approved' ? 'Completed' : s.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.completed 
                            ? (s.stage === 'quote' && quoteStatus === 'approved' ? 'Ready for invoice' : 'Completed')
                            : s.isCurrent 
                              ? 'In progress' 
                              : 'Pending'}
                        </p>
                        {s.stage === 'quote' && quoteStatus === 'approved' && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary cards - Updated */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Order Total</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(salesOrder.totalAmount)}</p>
                </div>
                <div className={`p-4 rounded-lg ${quoteStatus === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Quote</p>
                      <p className={`text-lg font-bold ${quoteStatus === 'approved' ? 'text-green-700' : 'text-gray-900'}`}>
                        {quoteStatus === 'approved' ? 'Completed' : quoteId ? 'Exists' : 'Missing'}
                      </p>
                    </div>
                    {quoteStatus === 'approved' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${invoiceId ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Invoice</p>
                      <p className={`text-lg font-bold ${invoiceId ? 'text-purple-700' : 'text-gray-900'}`}>
                        {invoiceId ? 'Created' : quoteStatus === 'approved' ? 'Next Step' : 'Not yet'}
                      </p>
                    </div>
                    {invoiceId && (
                      <Receipt className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {quoteId && (
                  <Link
                    href={`/quotes/${quoteId}`}
                    className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-3"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">View Quote</h4>
                      <p className="text-sm text-gray-600">Review quotation details</p>
                    </div>
                  </Link>
                )}

                {invoiceId && (
                  <Link
                    href={`/invoices/${invoiceId}`}
                    className="p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors flex items-center gap-3"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Receipt className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">View Invoice</h4>
                      <p className="text-sm text-gray-600">Check invoice details</p>
                    </div>
                  </Link>
                )}

                <button
                  onClick={handlePrint}
                  disabled={busy}
                  className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Printer className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Print</h4>
                    <p className="text-sm text-gray-600">Generate printable view</p>
                  </div>
                </button>
              </div>

              {currentStage?.stage === 'quote' && (
                <div className={`mt-4 p-4 rounded-lg ${quoteStatus === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    {quoteStatus === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-700 mt-0.5" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-700 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${quoteStatus === 'approved' ? 'text-green-900' : 'text-blue-900'}`}>
                        {quoteStatus === 'approved' ? 'Quote Approved ✓' : 'Quote Approval Required'}
                      </p>
                      <p className={`text-sm mt-1 ${quoteStatus === 'approved' ? 'text-green-800' : 'text-blue-800'}`}>
                        {quoteStatus === 'approved' 
                          ? 'The quote has been approved and marked as completed. The invoice has been automatically generated from the approved quote.'
                          : 'A quote has been auto-generated from the opportunity. Approve it to automatically generate an invoice. Once the invoice is paid, you can complete the sales order.'}
                      </p>
                      <div className={`mt-2 text-xs ${quoteStatus === 'approved' ? 'text-green-700' : 'text-blue-700'}`}>
                        {quoteStatus === 'approved' ? (
                          <>
                            <p>• ✓ Quote approved and completed</p>
                            <p>• ✓ Invoice generated automatically</p>
                            <p>• Next: View invoice and mark as paid</p>
                            <p>• Then: Complete sales order workflow</p>
                          </>
                        ) : (
                          <>
                            <p>• Quote is auto-generated from opportunity</p>
                            <p>• Approve quote to generate invoice</p>
                            <p>• Mark invoice as paid when payment is received</p>
                            <p>• Complete sales order to finish the workflow</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUOTATION */}
        {activeTab === 'quotation' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quotation</h3>
                <p className="text-sm text-gray-600">
                  {quoteStatus === 'approved' 
                    ? '✓ Quote has been approved and completed. Invoice has been generated.'
                    : 'Approve the quote to automatically generate an invoice.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {quoteId && (
                  <Link
                    href={`/quotes/${quoteId}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Quote
                  </Link>
                )}

                {/* Show different button based on status */}
                {quoteStatus === 'approved' ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">✓ Completed</span>
                  </div>
                ) : (
                  <button
                    onClick={handleAcceptQuoteAndGenerateInvoice}
                    disabled={!quoteId || busy || quoteStatus === 'approved'}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Accept & Generate Invoice
                  </button>
                )}
              </div>
            </div>

            {quoteId ? (
              <div className="space-y-6">
                {/* Quote Details - Updated for completed state */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg ${quoteStatus === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border'}`}>
                    <p className="text-sm text-gray-600 mb-1">Quote ID</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{quoteId}</p>
                    {quoteStatus === 'approved' && (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-700">Completed</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 rounded-lg border relative overflow-hidden ${
                    quoteStatus === 'approved' ? 'border-green-200' : ''
                  }`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      quoteStatus === 'approved' ? 'bg-green-500' :
                      quoteStatus === 'sent' ? 'bg-blue-500' :
                      quoteStatus === 'draft' ? 'bg-gray-500' :
                      'bg-red-500'
                    }`} />
                    <div className="ml-2">
                      <p className="text-sm text-gray-600">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {quoteStatus === 'approved' ? 'Completed' : quoteStatus}
                        </p>
                        {quoteStatus === 'approved' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-sm font-bold text-blue-700">
                      {typeof salesOrder.quoteId === 'object'
                        ? formatCurrency(salesOrder.quoteId.totalAmount)
                        : formatCurrency(salesOrder.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Show completion message if approved */}
                {quoteStatus === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Quote Approved & Completed ✓</p>
                        <p className="text-sm text-green-800 mt-1">
                          This quote has been approved and marked as completed. {invoiceId 
                            ? 'An invoice has been automatically generated from this quote.' 
                            : 'Invoice generation is in progress...'}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {invoiceId && (
                            <>
                              <Link
                                href={`/invoices/${invoiceId}`}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Generated Invoice
                              </Link>
                              <button
                                onClick={() => setActiveTab('invoice')}
                                className="px-3 py-1.5 border border-green-600 text-green-600 text-sm rounded hover:bg-green-50 flex items-center gap-1"
                              >
                                Go to Invoice Tab
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quote Flow Status - Updated for completed state */}
                <div className={`rounded-lg p-4 ${
                  quoteStatus === 'approved' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      quoteStatus === 'approved' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        quoteStatus === 'approved' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className={`font-medium ${
                        quoteStatus === 'approved' ? 'text-green-900' : 'text-blue-900'
                      }`}>
                        {quoteStatus === 'approved' ? 'Quote Flow Completed' : 'Quote Status Flow'}
                      </h4>
                      <p className={`text-sm ${
                        quoteStatus === 'approved' ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {quoteStatus === 'approved' 
                          ? 'All stages of the quotation process have been completed.'
                          : 'Current stage in the quotation process'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {/* Draft Step */}
                    <div className="text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        'bg-green-100 border-2 border-green-500'
                      }`}>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-xs font-medium">Created</p>
                    </div>
                    
                    <div className="flex-1 h-0.5 mx-2 bg-green-200" />
                    
                    {/* Sent Step */}
                    <div className="text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        'bg-green-100 border-2 border-green-500'
                      }`}>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-xs font-medium">Sent</p>
                    </div>
                    
                    <div className="flex-1 h-0.5 mx-2 bg-green-200" />
                    
                    {/* Approved Step */}
                    <div className="text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        'bg-green-100 border-2 border-green-500'
                      }`}>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-xs font-medium">Approved</p>
                      <p className="text-xs text-green-600 font-medium">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotation Found</h3>
                <p className="text-gray-600 mb-6">
                  This sales order should have a quote created automatically from the opportunity lifecycle.
                </p>
              </div>
            )}
          </div>
        )}

        {/* INVOICE */}
        {activeTab === 'invoice' && (
          <div className="space-y-6">
            {/* Invoice Header with Status Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invoice</h3>
                  <p className="text-sm text-gray-600">
                    {invoiceId 
                      ? `Invoice generated from approved quote ${quoteStatus === 'approved' ? '✓' : ''}`
                      : 'Invoice will be generated after quote acceptance.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {invoiceId ? (
                    <>
                      <Link
                        href={`/invoices/${invoiceId}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Invoice
                      </Link>

                      {/* Simplified: If invoice is not paid, show "Mark as Paid" button */}
                      {invoiceStatus !== 'paid' ? (
                        <button
                          onClick={handleMarkInvoiceAsPaid}
                          disabled={busy}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                          Mark as Paid
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg">
                          <PackageCheck className="h-5 w-5" />
                          <span className="font-medium">Order Completed</span>
                        </div>
                      )}
                    </>
                  ) : quoteStatus === 'approved' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-medium">Generating Invoice...</span>
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAcceptQuoteAndGenerateInvoice}
                      disabled={!quoteId || busy}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Generate Invoice
                    </button>
                  )}
                </div>
              </div>

              {/* Invoice Status Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Invoice Progress</span>
                  <span className="text-sm font-medium text-blue-600">
                    {!invoiceId ? '0%' : invoiceStatus === 'paid' ? '100%' : invoiceStatus === 'sent' ? '75%' : invoiceStatus === 'draft' ? '50%' : '25%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ 
                      width: !invoiceId ? '0%' : 
                        invoiceStatus === 'paid' ? '100%' : 
                        invoiceStatus === 'sent' ? '75%' : 
                        invoiceStatus === 'draft' ? '50%' : '25%' 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Not Created</span>
                  <span>Draft</span>
                  <span>Sent</span>
                  <span>Paid</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>

            {/* Invoice Status Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice Status Timeline</h3>
              
              <div className="relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 transform -translate-y-1/2"></div>
                
                <div className="relative flex justify-between">
                  {/* Step 1: Quote Approved */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 ${
                      quoteStatus === 'approved' 
                        ? 'bg-green-100 border-2 border-green-500' 
                        : 'bg-gray-100 border-2 border-gray-300'
                    }`}>
                      {quoteStatus === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-900">Quote Approved</span>
                    <span className="text-xs text-gray-500">Pre-requisite</span>
                    {quoteStatus === 'approved' && (
                      <span className="mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Done
                      </span>
                    )}
                  </div>
                  
                  {/* Step 2: Invoice Created */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 ${
                      invoiceId 
                        ? 'bg-green-100 border-2 border-green-500' 
                        : quoteStatus === 'approved'
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 border-2 border-gray-300'
                    }`}>
                      {invoiceId ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : quoteStatus === 'approved' ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        <Receipt className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-900">Invoice Created</span>
                    <span className="text-xs text-gray-500">Auto-generated</span>
                    {invoiceId && (
                      <span className="mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Done
                      </span>
                    )}
                  </div>
                  
                  {/* Step 3: Invoice Sent */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 ${
                      invoiceStatus === 'sent' || invoiceStatus === 'paid'
                        ? 'bg-green-100 border-2 border-green-500' 
                        : invoiceId
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 border-2 border-gray-300'
                    }`}>
                      {(invoiceStatus === 'sent' || invoiceStatus === 'paid') ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : invoiceId ? (
                        <Send className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Send className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-900">Invoice Sent</span>
                    <span className="text-xs text-gray-500">To customer</span>
                    {(invoiceStatus === 'sent' || invoiceStatus === 'paid') && (
                      <span className="mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Done
                      </span>
                    )}
                  </div>
                  
                  {/* Step 4: Payment Received */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 ${
                      invoiceStatus === 'paid' || salesOrder.status === 'delivered'
                        ? 'bg-green-100 border-2 border-green-500' 
                        : invoiceStatus === 'sent'
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 border-2 border-gray-300'
                    }`}>
                      {invoiceStatus === 'paid' || salesOrder.status === 'delivered' ? (
                        <CreditCard className="h-5 w-5 text-green-600" />
                      ) : invoiceStatus === 'sent' ? (
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-900">Payment Received</span>
                    <span className="text-xs text-gray-500">Mark as paid</span>
                    {(invoiceStatus === 'paid' || salesOrder.status === 'delivered') && (
                      <span className="mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Done
                      </span>
                    )}
                  </div>
                  
                  {/* Step 5: Sales Order Completed */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 ${
                      salesOrder.status === 'delivered'
                        ? 'bg-green-100 border-2 border-green-500' 
                        : invoiceStatus === 'paid'
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 border-2 border-gray-300'
                    }`}>
                      {salesOrder.status === 'delivered' ? (
                        <PackageCheck className="h-5 w-5 text-green-600" />
                      ) : invoiceStatus === 'paid' ? (
                        <PackageCheck className="h-5 w-5 text-blue-600" />
                      ) : (
                        <PackageCheck className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-900">Order Completed</span>
                    <span className="text-xs text-gray-500">Final step</span>
                    {salesOrder.status === 'delivered' && (
                      <span className="mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Done
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Status Summary */}
              <div className={`mt-6 p-4 rounded-lg ${
                !invoiceId 
                  ? 'bg-yellow-50 border border-yellow-200' 
                  : invoiceStatus === 'paid' || salesOrder.status === 'delivered'
                    ? 'bg-green-50 border border-green-200'
                    : invoiceStatus === 'sent'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  {!invoiceId ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">Awaiting Invoice Creation</p>
                        <p className="text-sm text-yellow-800">
                          {quoteStatus === 'approved' 
                            ? 'Invoice is being generated automatically from the approved quote...'
                            : 'Approve the quote first to generate the invoice.'}
                        </p>
                      </div>
                    </>
                  ) : invoiceStatus === 'paid' || salesOrder.status === 'delivered' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Payment Received & Order Completed ✓</p>
                        <p className="text-sm text-green-800">
                          Invoice has been paid and sales order is marked as delivered.
                        </p>
                      </div>
                    </>
                  ) : invoiceStatus === 'sent' ? (
                    <>
                      <Send className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Invoice Sent to Customer</p>
                        <p className="text-sm text-blue-800">
                          Invoice has been sent. Mark as paid when payment is received.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Invoice in Draft</p>
                        <p className="text-sm text-gray-800">
                          Invoice has been created. Mark it as paid to complete the sales order.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details Section */}
            {invoiceId ? (
              <div className="space-y-6">
                {/* Invoice Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                        <p className="font-semibold text-lg text-blue-700">
                          {typeof salesOrder.invoiceId === 'object' ? salesOrder.invoiceId.invoiceNumber : 'INV-…'}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-xl border p-5 ${
                    invoiceStatus === 'paid' 
                      ? 'bg-green-50 border-green-200' 
                      : invoiceStatus === 'sent'
                        ? 'bg-blue-50 border-blue-200'
                        : invoiceStatus === 'draft'
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <p className={`font-semibold text-lg ${
                          invoiceStatus === 'paid' ? 'text-green-700' :
                          invoiceStatus === 'sent' ? 'text-blue-700' :
                          'text-gray-900'
                        }`}>
                          {invoiceStatus === 'paid' ? 'Paid ✓' : 
                          invoiceStatus === 'sent' ? 'Sent' : 
                          invoiceStatus === 'draft' ? 'Draft' : 
                          'Pending'}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${
                        invoiceStatus === 'paid' ? 'bg-green-100' :
                        invoiceStatus === 'sent' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {invoiceStatus === 'paid' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : invoiceStatus === 'sent' ? (
                          <Send className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                        <p className="font-semibold text-lg text-purple-700">
                          {typeof salesOrder.invoiceId === 'object'
                            ? formatCurrency(salesOrder.invoiceId.totalAmount ?? salesOrder.invoiceId.total)
                            : formatCurrency(salesOrder.totalAmount)}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Created On</p>
                        <p className="font-semibold text-lg text-amber-700">
                          {typeof salesOrder.invoiceId === 'object'
                            ? formatDate(salesOrder.invoiceId.createdAt)
                            : '—'}
                        </p>
                      </div>
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Actions Card - Updated */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Actions</h3>
                  
                  <div className="space-y-4">
                    {invoiceStatus === 'draft' || invoiceStatus === 'sent' ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <CreditCard className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Ready for Payment</p>
                            <p className="text-sm text-green-800">
                              Mark this invoice as paid to automatically complete the sales order.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleMarkInvoiceAsPaid}
                          disabled={busy}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 text-sm disabled:opacity-50"
                        >
                          {busy ? 'Processing...' : 'Mark as Paid'}
                        </button>
                      </div>
                    ) : invoiceStatus === 'paid' && salesOrder.status !== 'delivered' ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Sales Order Completed ✓</p>
                            <p className="text-sm text-green-800">
                              Invoice has been paid. Sales order will be marked as delivered automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : salesOrder.status === 'delivered' ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Workflow Completed ✓</p>
                            <p className="text-sm text-green-800">
                              Sales order has been successfully completed and delivered.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
                    <span className="text-sm text-gray-600">
                      {(
                        (typeof salesOrder.invoiceId === 'object' && (salesOrder.invoiceId.items || salesOrder.invoiceId.lineItems)) ||
                        salesOrder.lineItems ||
                        []
                      ).length} items
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(
                          (typeof salesOrder.invoiceId === 'object' && (salesOrder.invoiceId.items || salesOrder.invoiceId.lineItems)) ||
                          salesOrder.lineItems ||
                          []
                        ).map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.description || item.productName || '—'}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity ?? '—'}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                            Total
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-bold text-blue-600">
                            {typeof salesOrder.invoiceId === 'object'
                              ? formatCurrency(salesOrder.invoiceId.totalAmount ?? salesOrder.invoiceId.total)
                              : formatCurrency(salesOrder.totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* No Invoice Created Yet Section */
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <Receipt className="h-12 w-12 text-blue-400" />
                    </div>
                    {quoteStatus === 'approved' && (
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-4 border-white">
                        <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {quoteStatus === 'approved' ? 'Invoice is Being Generated' : 'Invoice Not Created Yet'}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    {quoteStatus === 'approved' 
                      ? 'Your invoice is being automatically generated from the approved quote. This may take a few moments.'
                      : 'Accept the quote to automatically generate the invoice from quote items and totals.'}
                  </p>
                  
                  <div className="space-y-4">
                    {quoteStatus === 'approved' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing quote data...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Calculating invoice totals...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating invoice document...</span>
                        </div>
                        
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 mx-auto"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh Page
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAcceptQuoteAndGenerateInvoice}
                        disabled={!quoteId || busy}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50"
                      >
                        {busy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            Generating…
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 inline mr-2" />
                            Accept Quote & Generate Invoice
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {quoteStatus === 'approved' && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> If the invoice doesn't appear after a few minutes, 
                        try refreshing the page or contact support if the issue persists.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ITEMS */}
        {activeTab === 'items' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                <span className="text-sm text-gray-600">
                  {(salesOrder.lineItems?.length || 0)} item{(salesOrder.lineItems?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(salesOrder.lineItems || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.productName || '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{item.description || '—'}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity ?? '—'}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                        Total
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-blue-600">
                        {formatCurrency(salesOrder.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{salesOrder.customer?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{salesOrder.customer?.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{salesOrder.customer?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{salesOrder.customer?.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Documents</h3>

            <div className="space-y-3">
              {/* Quote */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Quote</p>
                    <p className="text-sm text-gray-600">{quoteId ? 'Created' : 'Missing'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {quoteId ? (
                    <Link href={`/quotes/${quoteId}`} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      View
                    </Link>
                  ) : (
                    <button
                      onClick={() => showToast('Create quote flow not wired in this rewrite', 'info')}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Create
                    </button>
                  )}
                </div>
              </div>

              {/* Invoice */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 text-green-700">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Invoice</p>
                    <p className="text-sm text-gray-600">{invoiceId ? 'Created' : 'Not yet'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {invoiceId ? (
                    <>
                      <Link href={`/invoices/${invoiceId}`} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        View
                      </Link>
                      <Link href={`/invoices/${invoiceId}/edit`} className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                        Edit
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleAcceptQuoteAndGenerateInvoice}
                      disabled={!quoteId || busy}
                      className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments (optional placeholder) */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Documents</h4>
              {attachments.length ? (
                <div className="space-y-2">
                  {attachments.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.type} • {formatDate(a.uploadedAt)}</p>
                      </div>
                      <button
                        onClick={() => window.open(a.url, '_blank')}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No additional documents attached.</p>
              )}
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {activityLog.length ? (
              <div className="space-y-3">
                {activityLog.map((a, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{a.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(a.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <History className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                No activity recorded yet.
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this sales order…"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />

            <div className="flex justify-end mt-2">
              <button
                onClick={() => {
                  setAddingNote(true);
                  setTimeout(() => {
                    setAddingNote(false);
                    setNotes('');
                    showToast('Note added successfully', 'success');
                  }, 800);
                }}
                disabled={addingNote || !notes.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {addingNote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Adding…
                  </>
                ) : (
                  'Add Note'
                )}
              </button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              (This rewrite keeps the notes UI placeholder. Wire it to your backend when ready.)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
