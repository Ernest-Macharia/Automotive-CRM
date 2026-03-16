import { Calendar, User, DollarSign, Users, BriefcaseIcon, MailIcon, Phone as PhoneIcon, ClipboardCheck, Wrench, ClipboardList, ReceiptIcon, ChevronRight, UserCheck, CalendarDays } from 'lucide-react';
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
      return (
        workOrder.opportunityId.customer.name ||
        workOrder.opportunityId.customer.companyName ||
        workOrder.opportunityId.subject ||
        'Unknown Customer'
      );
    }
    return 'Unknown Customer';
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

  const getAssignedTechnician = () => {
    if (workOrder.assignedTechnicians && workOrder.assignedTechnicians.length > 0) {
      const tech = workOrder.assignedTechnicians[0];
      if (tech && typeof tech === 'object') {
        return `${tech.firstName || ''} ${tech.lastName || ''}`.trim();
      }
    }
    return 'Not Assigned';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Customer Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Customer Information</h3>
            <p className="text-sm text-gray-600">Client details and contact</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-lg font-bold text-gray-900">{getCustomerName()}</h4>
            {customerDetails.company && (
              <p className="text-sm text-gray-600">{customerDetails.company}</p>
            )}
          </div>
          
          <div className="space-y-2">
            {customerDetails.email && (
              <div className="flex items-center gap-2 text-sm">
                <MailIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{customerDetails.email}</span>
              </div>
            )}
            {customerDetails.phone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{customerDetails.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-green-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Financial Summary</h3>
            <p className="text-sm text-gray-600">Cost breakdown and total</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-gray-600">Labor Cost</span>
            <span className="font-medium text-gray-900">{formatCurrency(workOrder.laborCost)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <span className="text-gray-600">Parts Cost</span>
            <span className="font-medium text-gray-900">{formatCurrency(workOrder.partsCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Additional Costs</span>
            <span className="font-medium text-gray-900">{formatCurrency(workOrder.additionalCosts || 0)}</span>
          </div>
          
          <div className="pt-3 mt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(workOrder.totalCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline & Assignment */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-purple-100 rounded-lg">
            <CalendarDays className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Timeline & Assignment</h3>
            <p className="text-sm text-gray-600">Schedule and resources</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Start Date</p>
              <p className="font-medium text-gray-900">{formatDate(workOrder.startDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Est. Completion</p>
              <p className="font-medium text-gray-900">{formatDate(workOrder.estimatedCompletionDate)}</p>
            </div>
          </div>
          
          {workOrder.actualCompletionDate && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs text-emerald-700 mb-1">Actual Completion</p>
              <p className="font-semibold text-emerald-800">{formatDate(workOrder.actualCompletionDate)}</p>
            </div>
          )}
          
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600">Lead Technician</p>
                <p className="font-medium text-gray-900">{getAssignedTechnician()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
