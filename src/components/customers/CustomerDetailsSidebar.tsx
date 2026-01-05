import { 
  Building2, User, Star, Award, Shield, CheckCircle, UserX, XCircle,
  MessageSquare, PhoneCall, FileText, Target 
} from 'lucide-react';
import { Customer } from '@/services/customersService';
import { format } from 'date-fns';

interface CustomerDetailsSidebarProps {
  customer: Customer;
}

export default function CustomerDetailsSidebar({ customer }: CustomerDetailsSidebarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getCustomerTierIcon = () => {
    switch (customer.customerTier) {
      case 'vip':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'gold':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'silver':
        return <Shield className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCustomerStatusIcon = () => {
    switch (customer.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <UserX className="h-4 w-4 text-gray-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <>
      {/* Customer Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
            {customer.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
          <p className="text-gray-600 mt-1">{customer.type === 'organization' ? 'Organization' : 'Individual'}</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              {customer.type === 'individual' ? (
                <User className="h-4 w-4 text-gray-400" />
              ) : (
                <Building2 className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-600 capitalize">{customer.type}</span>
            </div>
            <div className="text-sm text-gray-500">
              Customer since {formatDate(customer.createdAt)}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Send Message</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors">
              <PhoneCall className="h-4 w-4 text-green-600" />
              <span className="text-sm">Call Customer</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Create Opportunity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Customer Details</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Customer Tier</p>
            <div className="flex items-center gap-2">
              {getCustomerTierIcon()}
              <span className="capitalize">{customer.customerTier || 'Standard'}</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <div className="flex items-center gap-2">
              {getCustomerStatusIcon()}
              <span className="capitalize">{customer.status || 'Active'}</span>
            </div>
          </div>

          {customer.contactPersonName && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Contact Person</p>
              <p className="font-medium">{customer.contactPersonName}</p>
              {customer.contactPersonTitle && (
                <p className="text-sm text-gray-600">{customer.contactPersonTitle}</p>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-1">Payment Terms</p>
            <p className="font-medium">{customer.paymentTerms || 'Net 30'}</p>
          </div>

          {customer.creditLimit && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Credit Limit</p>
              <p className="font-medium">{formatCurrency(customer.creditLimit)}</p>
            </div>
          )}

          {customer.outstandingBalance && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
              <p className="font-medium text-red-600">
                {formatCurrency(customer.outstandingBalance)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
        <div className="space-y-4">
          {customer.opportunities && customer.opportunities.slice(0, 3).map((opp) => (
            <div key={opp._id} className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{opp.subject}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(opp.createdAt)} • {opp.status}
                </p>
              </div>
            </div>
          ))}
          {(!customer.opportunities || customer.opportunities.length === 0) && (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </>
  );
}