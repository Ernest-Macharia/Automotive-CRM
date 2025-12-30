'use client';

import { X, Download, Mail, CheckCircle, Printer, Copy, User, Building, Car } from 'lucide-react';
import { Quote } from '@/services/quoteService';
import { quoteService } from '@/services/quoteService';

interface QuoteDetailModalProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
  onExport: (quote: Quote) => void;
  onSendEmail: (quote: Quote) => void;
  onApprove?: (quote: Quote) => void;
}

export default function QuoteDetailModal({
  quote,
  isOpen,
  onClose,
  onExport,
  onSendEmail,
  onApprove
}: QuoteDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const handleCopyToClipboard = () => {
    const text = `
Quote: ${quote.quoteNumber}
Total: ${quoteService.formatCurrency(quote.totalAmount)}
Status: ${quote.status}
Created: ${new Date(quote.createdAt).toLocaleDateString()}
    `.trim();
    
    navigator.clipboard.writeText(text);
    alert('Quote details copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Quote: {quote.quoteNumber}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)} flex items-center gap-2`}>
                      {getStatusIcon(quote.status)}
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Created: {new Date(quote.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy Details"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quote Information */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Quote Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Opportunity</p>
                      <p className="font-medium text-gray-900">
                        {typeof quote.opportunityId === 'object' 
                          ? quote.opportunityId.subject || quote.opportunityId._id
                          : quote.opportunityId}
                      </p>
                    </div>
                    
                    {quote.vehicleId && (
                      <div>
                        <p className="text-sm text-gray-500">Vehicle</p>
                        <p className="font-medium text-gray-900">
                          {typeof quote.vehicleId === 'object'
                            ? `${quote.vehicleId.registrationNumber || ''} ${quote.vehicleId.make || ''} ${quote.vehicleId.model || ''}`.trim()
                            : quote.vehicleId}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium text-gray-900">
                        {typeof quote.createdBy === 'object'
                          ? quote.createdBy.name || quote.createdBy.email || 'System'
                          : quote.createdBy || 'System'}
                      </p>
                    </div>
                    
                    {quote.jobCardId && (
                      <div>
                        <p className="text-sm text-gray-500">Job Card</p>
                        <p className="font-medium text-gray-900">
                          {typeof quote.jobCardId === 'object'
                            ? quote.jobCardId.jobCardNumber || quote.jobCardId._id
                            : quote.jobCardId}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Items</h5>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {quote.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.description}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {quoteService.formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {quoteService.formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Notes</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {quote.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary & Actions */}
              <div>
                {/* Summary Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Summary</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        {quoteService.formatCurrency(quote.subtotal || 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">
                        {quoteService.formatCurrency(quote.tax || 0)}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {quoteService.formatCurrency(quote.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h4>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => onExport(quote)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Export PDF/JSON
                    </button>
                    
                    <button
                      onClick={() => onSendEmail(quote)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 text-orange-700 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </button>
                    
                    <button
                      onClick={handlePrint}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-700 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </button>
                    
                    {quote.status === 'pending' && onApprove && (
                      <button
                        onClick={() => onApprove(quote)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 rounded-lg hover:from-green-100 hover:to-green-200 transition-all"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Quote
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Quote Created</p>
                        <p className="text-xs text-gray-500">
                          {new Date(quote.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          By: {typeof quote.createdBy === 'object' 
                            ? quote.createdBy.name || quote.createdBy.email 
                            : quote.createdBy || 'System'}
                        </p>
                      </div>
                    </div>
                    
                    {quote.approvedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Quote Approved</p>
                          <p className="text-xs text-gray-500">
                            {new Date(quote.approvedAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            By: {typeof quote.approvedBy === 'object'
                              ? quote.approvedBy.name || quote.approvedBy.email
                              : quote.approvedBy}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Last Updated</p>
                          <p className="text-xs text-gray-500">
                            {new Date(quote.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}