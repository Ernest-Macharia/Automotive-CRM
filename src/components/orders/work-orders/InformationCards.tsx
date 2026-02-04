import { Calendar, User, DollarSign, Users, BriefcaseIcon, MailIcon, Phone as PhoneIcon } from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { format } from 'date-fns';

interface InformationCardsProps {
  workOrder: WorkOrder;
}

export default function InformationCards({ workOrder }: InformationCardsProps) {
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
    return 'Unknown Customer';
  };

  const getAssignedToName = () => {
    if (typeof workOrder.assignedTo === 'object') {
      return `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}`;
    }
    return 'Unassigned';
  };

  const getCustomerDetails = () => {
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer) {
      const customer = workOrder.opportunityId.customer;
      return {
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.companyName || ''
      };
    }
    return { email: '', phone: '', company: '' };
  };

  const customerDetails = getCustomerDetails();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Customer Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <Users className="h-6 w-6 text-blue-600" />
          <span className="text-sm font-medium text-gray-500">Customer</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{getCustomerName()}</h3>
        <div className="space-y-2">
          {customerDetails.company && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BriefcaseIcon className="h-4 w-4" />
              <span>{customerDetails.company}</span>
            </div>
          )}
          {customerDetails.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MailIcon className="h-4 w-4" />
              <span>{customerDetails.email}</span>
            </div>
          )}
          {customerDetails.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4" />
              <span>{customerDetails.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <DollarSign className="h-6 w-6 text-green-600" />
          <span className="text-sm font-medium text-gray-500">Financial</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Labor:</span>
            <span className="font-semibold">{formatCurrency(workOrder.laborCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Parts:</span>
            <span className="font-semibold">{formatCurrency(workOrder.partsCost)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-gray-900 font-semibold">Total:</span>
            <span className="font-bold text-lg text-blue-600">
              {formatCurrency(workOrder.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <Calendar className="h-6 w-6 text-purple-600" />
          <span className="text-sm font-medium text-gray-500">Timeline</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Start:</span>
            <span className="font-semibold">{formatDate(workOrder.startDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Est. Completion:</span>
            <span className="font-semibold">{formatDate(workOrder.estimatedCompletionDate)}</span>
          </div>
          {workOrder.actualCompletionDate && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed:</span>
              <span className="font-semibold text-green-600">{formatDate(workOrder.actualCompletionDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}