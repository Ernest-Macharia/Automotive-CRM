'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Calendar, User, DollarSign, 
  Truck, Package, CheckCircle, Clock, AlertCircle,
  MoreVertical, Eye, Edit, Trash2, ExternalLink
} from 'lucide-react';
import { SalesOrder } from '@/services/salesOrderService';
import { format } from 'date-fns';

interface SalesOrderCardProps {
  salesOrder: SalesOrder;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export default function SalesOrderCard({ 
  salesOrder, 
  onView, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: SalesOrderCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
      case 'confirmed': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700';
      case 'processing': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700';
      case 'shipped': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700';
      case 'delivered': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700';
      case 'cancelled': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const customerName = typeof salesOrder.opportunityId === 'object' 
    ? salesOrder.opportunityId.customer.name
    : 'Loading...';

  const orderTotal = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(salesOrder.totalAmount);

  return (
    <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{salesOrder.salesOrderNumber}</h3>
              <p className="text-sm text-gray-500">{customerName}</p>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onView?.(salesOrder._id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      onEdit?.(salesOrder._id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(salesOrder._id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {formatDate(salesOrder.orderDate)}
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(salesOrder.status)}`}>
              {getStatusIcon(salesOrder.status)}
              <span className="capitalize">{salesOrder.status.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-lg font-bold text-gray-800">{orderTotal}</span>
          </div>

          {salesOrder.estimatedDeliveryDate && (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Est. Delivery: {formatDate(salesOrder.estimatedDeliveryDate)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Subtotal:</div>
            <div className="text-right font-medium">
              {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(salesOrder.subtotal)}
            </div>
            <div className="text-gray-600">Tax:</div>
            <div className="text-right font-medium">
              {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(salesOrder.tax || 0)}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              href={`/sales-orders/${salesOrder._id}`}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              View Full Details
            </Link>
            
            {onStatusChange && salesOrder.status !== 'delivered' && salesOrder.status !== 'cancelled' && (
              <button
                onClick={() => {
                  // Determine next status
                  const nextStatus = salesOrder.status === 'draft' ? 'confirmed' :
                                   salesOrder.status === 'confirmed' ? 'processing' :
                                   salesOrder.status === 'processing' ? 'shipped' :
                                   salesOrder.status === 'shipped' ? 'delivered' : 'draft';
                  onStatusChange(salesOrder._id, nextStatus);
                }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                {salesOrder.status === 'draft' ? 'Confirm' :
                 salesOrder.status === 'confirmed' ? 'Process' :
                 salesOrder.status === 'processing' ? 'Ship' :
                 'Deliver'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}