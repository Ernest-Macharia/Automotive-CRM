import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ReceiptIcon, Eye, DollarSign, CheckCircle, 
  Loader2, AlertCircle, FileText, Calendar,
  Download, Share2, Printer, Check
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format } from 'date-fns';
import { invoiceService } from '@/services/invoiceService';

interface InvoiceTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

export default function InvoiceTab({ workOrder, isTransitioning, onAction }: InvoiceTabProps) {
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(false);
  const [showLinkInvoiceModal, setShowLinkInvoiceModal] = useState(false);
  const [invoiceIdToLink, setInvoiceIdToLink] = useState('');

  // In InvoiceTab.tsx - Update the handleGenerateInvoice function:
  const handleGenerateInvoice = async () => {
    setLocalLoading(true);
    try {
      await onAction(async () => {
        // Generate invoice using the invoice service
        const invoiceResult = await invoiceService.createInvoiceFromWorkOrder(workOrder._id);
        
        // Send invoice email to customer
        try {
          await invoiceService.sendInvoiceEmail(invoiceResult.invoice._id);
        } catch (emailError) {
          console.warn('Invoice created but email sending failed:', emailError);
          // Don't throw - invoice was created successfully
        }
        
        // Update work order
        await workOrderService.updateWorkOrder(workOrder._id, {
          invoiceId: invoiceResult.invoice._id,
          currentStage: 'invoice',
          status: 'ready_for_invoice',
          updatedAt: new Date().toISOString()
        });
      });
    } finally {
      setLocalLoading(false);
    }
  };

  // Update handleMarkAsPaid to use invoice approval endpoint:
  const handleMarkAsPaid = async () => {
    if (!workOrder.invoiceId) {
      console.error('No invoice ID found');
      return;
    }
    
    setLocalLoading(true);
    try {
      await onAction(async () => {
        // Use the PATCH invoices/{id}/pay endpoint
        await invoiceService.markInvoiceAsPaid(
          workOrder.invoiceId,
          // Add userId, userRole if available
          sessionStorage.getItem('userId'),
          sessionStorage.getItem('userRole'),
          'cash', // or get payment method from UI
          `Payment for work order ${workOrder.workOrderNumber}`
        );
        
        // Then update the work order
        await workOrderService.updateWorkOrder(workOrder._id, {
          invoicePaid: true,
          invoicePaymentDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    } finally {
      setLocalLoading(false);
    }
  };

  // Update handleCompleteWorkOrder to use invoice approval endpoint:
  const handleCompleteWorkOrder = async () => {
    if (!workOrder.invoiceId) {
      console.error('No invoice ID found');
      return;
    }
    
    setLocalLoading(true);
    try {
      await onAction(async () => {
        // First approve the invoice if not already approved
        await invoiceService.approveInvoice(
          workOrder.invoiceId,
          sessionStorage.getItem('userId'),
          sessionStorage.getItem('userRole')
        );
        
        // Then complete the work order
        await workOrderService.updateWorkOrder(workOrder._id, {
          status: 'completed',
          actualCompletionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLinkInvoice = async () => {
    if (!invoiceIdToLink.trim()) return;
    
    setLocalLoading(true);
    try {
      await workOrderService.linkInvoice(workOrder._id, invoiceIdToLink);
      setShowLinkInvoiceModal(false);
      setInvoiceIdToLink('');
      
      // Refresh the page
      window.location.reload();
    } finally {
      setLocalLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'KES 0';
    return workOrderService.formatCurrency(amount);
  };

  const getCustomerName = () => {
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer) {
      return workOrder.opportunityId.customer.name;
    }
    return 'Customer';
  };

  const isPaid = workOrder.invoicePaid || false;
  const isCompleted = workOrder.status === 'completed';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invoice</h3>
          <p className="text-sm text-gray-600">Billing and payment</p>
        </div>
        {workOrder.invoiceId ? (
          <div className="flex items-center gap-2">
            {!isPaid && (
              <button
                onClick={handleMarkAsPaid}
                disabled={isTransitioning || localLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {(isTransitioning || localLoading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                Mark as Paid
              </button>
            )}
            {isPaid && !isCompleted && (
              <button
                onClick={handleCompleteWorkOrder}
                disabled={isTransitioning || localLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {(isTransitioning || localLoading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Complete Work Order
              </button>
            )}
            <button
              onClick={() => window.open(`/invoices/${workOrder.invoiceId}`, '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Invoice
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLinkInvoiceModal(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Link Invoice
            </button>
            <button
              onClick={handleGenerateInvoice}
              disabled={isTransitioning || localLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {(isTransitioning || localLoading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ReceiptIcon className="h-4 w-4" />
              )}
              Generate Invoice
            </button>
          </div>
        )}
      </div>
      
      {workOrder.invoiceId ? (
        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <ReceiptIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Invoice Details</h4>
                    <p className="text-gray-600">
                      Invoice for {getCustomerName()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Invoice Amount</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(workOrder.totalCost)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isPaid ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Paid
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          Pending
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Payment Date</div>
                    <div className="font-medium">
                      {workOrder.invoicePaymentDate 
                        ? formatDate(workOrder.invoicePaymentDate)
                        : 'Not paid'}
                    </div>
                  </div>
                </div>
                
                {/* Invoice Items */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">Invoice Breakdown</h5>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-4 bg-gray-50 p-3 text-sm font-medium text-gray-700">
                      <div>Description</div>
                      <div className="text-right">Quantity</div>
                      <div className="text-right">Unit Price</div>
                      <div className="text-right">Total</div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      <div className="grid grid-cols-4 p-3 text-sm">
                        <div>Labor Services</div>
                        <div className="text-right">1</div>
                        <div className="text-right">{formatCurrency(workOrder.laborCost)}</div>
                        <div className="text-right font-medium">{formatCurrency(workOrder.laborCost)}</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 text-sm">
                        <div>Parts & Materials</div>
                        <div className="text-right">1</div>
                        <div className="text-right">{formatCurrency(workOrder.partsCost)}</div>
                        <div className="text-right font-medium">{formatCurrency(workOrder.partsCost)}</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 text-sm bg-gray-50 font-medium">
                        <div>Total Amount</div>
                        <div></div>
                        <div></div>
                        <div className="text-right text-lg text-blue-600">
                          {formatCurrency(workOrder.totalCost)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.open(`/invoices/${workOrder.invoiceId}`, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Full Invoice
              </button>
              
              {!isPaid && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={isTransitioning || localLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {(isTransitioning || localLoading) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Mark as Paid
                </button>
              )}
              
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              
              <button
                onClick={() => {
                  // Download invoice logic
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
          
          {/* Work Order Completion */}
          {isPaid && !isCompleted && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">✓ Invoice Paid</h4>
                  <p className="text-gray-600 mb-4">
                    Payment received on {formatDate(workOrder.invoicePaymentDate)}. 
                    You can now complete the work order.
                  </p>
                  <button
                    onClick={handleCompleteWorkOrder}
                    disabled={isTransitioning || localLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {(isTransitioning || localLoading) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Complete Work Order
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ReceiptIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Invoice Created</h4>
              <p className="text-gray-600 mb-6">
                Generate an invoice or link an existing one to proceed with billing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleGenerateInvoice}
                  disabled={isTransitioning || localLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {(isTransitioning || localLoading) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ReceiptIcon className="h-4 w-4" />
                  )}
                  Generate New Invoice
                </button>
                <button
                  onClick={() => setShowLinkInvoiceModal(true)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Link Existing Invoice
                </button>
              </div>
            </div>
          </div>

          {/* Estimated Costs Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h5 className="font-medium text-gray-900 mb-4">Estimated Costs</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Labor Cost</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(workOrder.laborCost)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Parts Cost</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(workOrder.partsCost)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Estimated</div>
                <div className="text-xl font-semibold text-blue-600">
                  {formatCurrency(workOrder.totalCost)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Invoice Modal */}
      {showLinkInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Link Existing Invoice
              </h3>
              <p className="text-gray-600 mb-4">
                Enter the invoice ID to link to this work order.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice ID
                  </label>
                  <input
                    type="text"
                    value={invoiceIdToLink}
                    onChange={(e) => setInvoiceIdToLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter invoice ID..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowLinkInvoiceModal(false);
                      setInvoiceIdToLink('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLinkInvoice}
                    disabled={!invoiceIdToLink.trim() || localLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {localLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Link Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}