'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Wrench, Calendar, User, DollarSign, 
  Clock, Users, CheckCircle, AlertCircle, 
  MoreVertical, Eye, Edit, Trash2, ExternalLink,
  FileText
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { format } from 'date-fns';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export default function WorkOrderCard({ 
  workOrder, 
  onView, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: WorkOrderCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'in_progress': return <Wrench className="h-4 w-4" />;
      case 'on_hold': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
      case 'in_progress': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700';
      case 'on_hold': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700';
      case 'completed': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700';
      case 'cancelled': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const customerName = typeof workOrder.opportunityId === 'object' 
    ? workOrder.opportunityId.customer.name
    : 'Loading...';

  const totalCost = workOrder.laborCost + workOrder.partsCost;

  return (
    <div className="bg-gradient-to-r from-white to-green-50/30 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{workOrder.workOrderNumber}</h3>
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
                      onView?.(workOrder._id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      onEdit?.(workOrder._id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(workOrder._id);
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
                {workOrder.startDate ? formatDate(workOrder.startDate) : 'Not started'}
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(workOrder.status)}`}>
              {getStatusIcon(workOrder.status)}
              <span className="capitalize">{workOrder.status.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">Labor Cost</span>
              </div>
              <div className="text-lg font-bold text-blue-800">
                {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(workOrder.laborCost)}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Parts Cost</span>
              </div>
              <div className="text-lg font-bold text-green-800">
                {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(workOrder.partsCost)}
              </div>
            </div>
          </div>

          {workOrder.estimatedCompletionDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Est. Completion: {formatDate(workOrder.estimatedCompletionDate)}
              </span>
              {workOrder.estimatedHours && (
                <span className="text-xs text-gray-500">
                  ({workOrder.estimatedHours} hrs)
                </span>
              )}
            </div>
          )}

          {workOrder.jobCards && workOrder.jobCards.length > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {workOrder.jobCards.length} job card{workOrder.jobCards.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              href={`/orders/work-orders/${workOrder._id}`}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              View Full Details
            </Link>
            
            {onStatusChange && workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
              <button
                onClick={() => {
                  // Determine next status
                  const nextStatus = workOrder.status === 'draft' ? 'in_progress' :
                                   workOrder.status === 'in_progress' ? 'on_hold' :
                                   workOrder.status === 'on_hold' ? 'completed' :
                                   workOrder.status === 'completed' ? 'cancelled' : 'draft';
                  onStatusChange(workOrder._id, nextStatus);
                }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-medium hover:from-green-600 hover:to-teal-700 transition-all"
              >
                {workOrder.status === 'draft' ? 'Start Work' :
                 workOrder.status === 'in_progress' ? 'Hold' :
                 workOrder.status === 'on_hold' ? 'Complete' :
                 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}