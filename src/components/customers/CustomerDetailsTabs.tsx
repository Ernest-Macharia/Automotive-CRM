import { 
  Mail, Phone, PhoneCall, Building2, MapPin, Tag, 
  Target, Car, ChevronRight, DollarSign, User, Award, 
  Shield, Star, CheckCircle, UserX, XCircle, 
  AlertCircle
} from 'lucide-react';
import { Customer } from '@/services/customersService';
import { format } from 'date-fns';

interface CustomerDetailsTabsProps {
  customer: Customer;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isFallback?: boolean;
}

export default function CustomerDetailsTabs({ 
  customer, 
  activeTab, 
  onTabChange,
  isFallback = false
}: CustomerDetailsTabsProps) {
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

  const tabs = ['overview', 'opportunities', 'vehicles', 'activity', 'documents'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 px-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {isFallback && (
            <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
            <div className="flex items-center text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 mr-2" />
                Some customer data may be unavailable or limited
            </div>
            </div>
        )}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                  {customer.companyPhone && (
                    <div className="flex items-center gap-3">
                      <PhoneCall className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Company Phone</p>
                        <p className="font-medium">{customer.companyPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="space-y-4">
                  {customer.companyName && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="font-medium">{customer.companyName}</p>
                      </div>
                    </div>
                  )}
                  {customer.companyAddress && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{customer.companyAddress}</p>
                      </div>
                    </div>
                  )}
                  {customer.companyTaxId && (
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Tax ID</p>
                        <p className="font-medium">{customer.companyTaxId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Stats */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(customer.totalSpent || 0)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {customer.totalOrders || 0}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600">Average Order</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(
                      customer.totalOrders && customer.totalSpent
                        ? customer.totalSpent / customer.totalOrders
                        : 0
                    )}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600">Last Order</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatDate(customer.lastOrderDate || '')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunities</h3>
            {customer.opportunities && customer.opportunities.length > 0 ? (
              <div className="space-y-4">
                {customer.opportunities.map((opp) => (
                  <div key={opp._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{opp.subject}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Status: {opp.status}</span>
                          <span>Created: {formatDate(opp.createdAt)}</span>
                          {opp.total && (
                            <span className="font-medium text-blue-600">
                              {formatCurrency(opp.total)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No opportunities found</p>
              </div>
            )}
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicles</h3>
            {customer.vehicles && customer.vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.vehicles.map((vehicle, index) => (
                  <div key={vehicle._id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Car className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </h4>
                        {vehicle.registrationNumber && (
                          <p className="text-sm text-gray-600 mt-1">
                            Registration: {vehicle.registrationNumber}
                          </p>
                        )}
                        {vehicle.year && (
                          <p className="text-sm text-gray-600">Year: {vehicle.year}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No vehicles found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}