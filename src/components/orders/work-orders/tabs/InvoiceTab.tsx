import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ReceiptIcon, Eye, DollarSign, CheckCircle, 
  Loader2, AlertCircle, FileText, Calendar,
  Download, Share2, Printer, Check,
  PartyPopper,
  Trophy,
  Percent
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format } from 'date-fns';
import { invoiceService, Invoice } from '@/services/invoiceService';

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
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Load invoice details when invoiceId is available
  useEffect(() => {
    const loadInvoiceDetails = async () => {
      if (workOrder.invoiceId) {
        try {
          setLoadingInvoice(true);
          const invoice = await invoiceService.getInvoiceById(workOrder.invoiceId);
          setInvoiceDetails(invoice);
        } catch (error) {
          console.error('Error loading invoice details:', error);
        } finally {
          setLoadingInvoice(false);
        }
      }
    };

    loadInvoiceDetails();
  }, [workOrder.invoiceId]);

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
        }
        
        // Load the newly created invoice details
        const invoice = await invoiceService.getInvoiceById(invoiceResult.invoice._id);
        setInvoiceDetails(invoice);
        
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

  const handleMarkAsPaid = async () => {
    if (!workOrder.invoiceId) {
      console.error('No invoice ID found');
      return;
    }
    
    setLocalLoading(true);
    try {
      await onAction(async () => {
        // Mark invoice as paid using the PATCH invoices/{id}/pay endpoint
        const paidInvoice = await invoiceService.markInvoiceAsPaid(
          workOrder.invoiceId,
          sessionStorage.getItem('userId'),
          sessionStorage.getItem('userRole'),
          'cash',
          `Payment for work order ${workOrder.workOrderNumber}`
        );
        
        // Update invoice details
        setInvoiceDetails(paidInvoice);
        
        // Update work order to mark as paid AND completed
        await workOrderService.updateWorkOrder(workOrder._id, {
          invoicePaid: true,
          invoicePaymentDate: new Date().toISOString(),
          status: 'completed',
          actualCompletionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Show success message
        setShowPaymentSuccess(true);
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
      
      // Load the linked invoice details
      const invoice = await invoiceService.getInvoiceById(invoiceIdToLink);
      setInvoiceDetails(invoice);
      
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

  // Calculate invoice totals
  const getInvoiceTotal = () => {
    if (invoiceDetails) {
      return invoiceDetails.total; // This includes tax
    }
    return workOrder.totalCost || 0; // Fallback to work order total
  };

  const getInvoiceSubtotal = () => {
    if (invoiceDetails) {
      return invoiceDetails.subtotal;
    }
    return workOrder.totalCost || 0; // Fallback
  };

  const getInvoiceTax = () => {
    if (invoiceDetails) {
      return invoiceDetails.tax;
    }
    return 0;
  };

  const getInvoiceItems = () => {
    if (invoiceDetails && invoiceDetails.items && invoiceDetails.items.length > 0) {
      return invoiceDetails.items;
    }
    // Fallback to work order breakdown
    return [
      { description: 'Labor Services', quantity: 1, unitPrice: workOrder.laborCost || 0, total: workOrder.laborCost || 0 },
      { description: 'Parts & Materials', quantity: 1, unitPrice: workOrder.partsCost || 0, total: workOrder.partsCost || 0 }
    ];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Payment Success Message */}
      {showPaymentSuccess && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <PartyPopper className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-800">Payment Recorded Successfully!</h3>
              <p className="text-sm text-green-700">
                Invoice marked as paid and work order is now completed.
              </p>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="text-green-600 hover:text-green-800"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invoice</h3>
          <p className="text-sm text-gray-600">Billing and payment</p>
        </div>
        {workOrder.invoiceId ? (
          <div className="flex items-center gap-2">
            {!isPaid && !isCompleted && (
              <button
                onClick={handleMarkAsPaid}
                disabled={isTransitioning || localLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {(isTransitioning || localLoading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                Mark as Paid & Complete Work Order
              </button>
            )}
            
            {isCompleted && (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Work Order Completed
                </div>
                <button
                  onClick={() => window.open(`/invoices/${workOrder.invoiceId}`, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Invoice
                </button>
              </div>
            )}

            {isPaid && !isCompleted && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(`/invoices/${workOrder.invoiceId}`, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Invoice
                </button>
              </div>
            )}
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
          <div className={`border rounded-xl p-6 ${
            isCompleted 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
              : 'bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-lg shadow-sm ${
                    isCompleted ? 'bg-white' : 'bg-white'
                  }`}>
                    <ReceiptIcon className={`h-6 w-6 ${
                      isCompleted ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Invoice Details</h4>
                    <p className="text-gray-600">
                      Invoice for {getCustomerName()}
                      {isCompleted && ' ✓ Completed'}
                    </p>
                  </div>
                </div>
                
                {/* Invoice Amount Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Invoice Total</div>
                    <div className={`text-2xl font-bold ${
                      isCompleted ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {loadingInvoice ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        formatCurrency(getInvoiceTotal())
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Includes tax
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Subtotal</div>
                    <div className="text-xl font-medium text-gray-900">
                      {loadingInvoice ? (
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        formatCurrency(getInvoiceSubtotal())
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Tax Amount</div>
                    <div className="text-xl font-medium text-gray-900">
                      {loadingInvoice ? (
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        formatCurrency(getInvoiceTax())
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">VAT included</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      isCompleted ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' :
                      isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isCompleted ? (
                        <>
                          <Trophy className="h-4 w-4" />
                          Completed
                        </>
                      ) : isPaid ? (
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
                    <div className="text-xs text-gray-500 mt-2">
                      {isCompleted && workOrder.actualCompletionDate 
                        ? `Completed on ${formatDate(workOrder.actualCompletionDate)}`
                        : workOrder.invoicePaymentDate 
                          ? `Paid on ${formatDate(workOrder.invoicePaymentDate)}`
                          : 'Payment pending'}
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
                      {loadingInvoice ? (
                        // Loading skeleton
                        Array.from({ length: 2 }).map((_, index) => (
                          <div key={index} className="grid grid-cols-4 p-3 text-sm">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ))
                      ) : (
                        <>
                          {getInvoiceItems().map((item, index) => (
                            <div key={index} className="grid grid-cols-4 p-3 text-sm">
                              <div>{item.description}</div>
                              <div className="text-right">{item.quantity}</div>
                              <div className="text-right">{formatCurrency(item.unitPrice)}</div>
                              <div className="text-right font-medium">{formatCurrency(item.total)}</div>
                            </div>
                          ))}
                          {/* Tax Row */}
                          {getInvoiceTax() > 0 && (
                            <div className="grid grid-cols-4 p-3 text-sm border-t border-gray-300">
                              <div className="col-span-3 text-right font-medium">Tax (VAT)</div>
                              <div className="text-right font-medium">{formatCurrency(getInvoiceTax())}</div>
                            </div>
                          )}
                          {/* Total Row */}
                          <div className="grid grid-cols-4 p-3 text-sm bg-gray-50 font-medium border-t border-gray-300">
                            <div className="col-span-3 text-lg">Total Amount</div>
                            <div className={`text-right text-lg ${
                              isCompleted ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {formatCurrency(getInvoiceTotal())}
                            </div>
                          </div>
                        </>
                      )}
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
              
              {!isPaid && !isCompleted && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={isTransitioning || localLoading || loadingInvoice}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {(isTransitioning || localLoading) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Mark as Paid & Complete Work Order
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
          
          {/* Work Order Completion Status */}
          {isCompleted && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">✓ Work Order Completed</h4>
                  <div className="space-y-2 text-gray-600">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Invoice total: {formatCurrency(getInvoiceTotal())} (includes {formatCurrency(getInvoiceTax())} tax)
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Invoice paid on {formatDate(workOrder.invoicePaymentDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Work order completed on {formatDate(workOrder.actualCompletionDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      All workflow stages completed successfully
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Pending - Work Order Ready for Completion */}
          {isPaid && !isCompleted && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">✓ Invoice Paid</h4>
                  <p className="text-gray-600 mb-4">
                    Payment of {formatCurrency(getInvoiceTotal())} (includes {formatCurrency(getInvoiceTax())} tax) 
                    received on {formatDate(workOrder.invoicePaymentDate)}.
                  </p>
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
            <div className="mt-4 text-sm text-gray-500">
              <p>Note: Final invoice will include applicable taxes and additional charges.</p>
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