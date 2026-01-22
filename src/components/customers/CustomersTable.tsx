import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Mail, Phone, Car, Eye, Edit, Trash2, 
  ChevronLeft, ChevronRight, User, Building2, 
  CheckCircle, XCircle, UserX, Star, Award, Shield, Crown
} from 'lucide-react';
import { Customer } from '@/services/customersService';
import { format } from 'date-fns';

interface CustomersTableProps {
  customers: Customer[];
  totalCustomers: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number; 
  onPageChange: (page: number) => void;
  // onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  loading?: boolean;
}

export default function CustomersTable({
  customers,
  totalCustomers,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  // onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  loading = false
}: CustomersTableProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return format(date, 'MMM dd, yyyy');
    } catch {
        return '—';
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <User className="h-4 w-4" />;
      case 'organization': return <Building2 className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getCustomerTierBadge = (tier: string | undefined) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'gold': { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800',
        icon: <Star className="h-3 w-3" />
      },
      'silver': { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        icon: <Award className="h-3 w-3" />
      },
      'bronze': { 
        bg: 'bg-orange-100', 
        text: 'text-orange-800',
        icon: <Shield className="h-3 w-3" />
      },
      'vip': { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800',
        icon: <Crown className="h-3 w-3" />
      },
      'standard': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        icon: <User className="h-3 w-3" />
      }
    };
    
    const tierConfig = tier && config[tier] ? config[tier] : config.standard;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${tierConfig.bg} ${tierConfig.text}`}>
        {tierConfig.icon}
        <span className="capitalize">{tier || 'Standard'}</span>
      </div>
    );
  };

  const getCustomerStatusBadge = (status: string | undefined) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'active': { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      'inactive': { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        icon: <UserX className="h-3 w-3" />
      },
      'suspended': { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        icon: <XCircle className="h-3 w-3" />
      }
    };
    
    const statusConfig = status && config[status] ? config[status] : config.active;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.text}`}>
        {statusConfig.icon}
        <span className="capitalize">{status || 'Active'}</span>
      </div>
    );
  };

  // const handleRowClick = (customer: Customer) => {
  //   router.push(`/customers/${customer._id}`);
  // };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Customers</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalCustomers} customers found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Order
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No customers found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your filters or search term
                  </p>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr 
                  key={customer._id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  // onClick={() => handleRowClick(customer)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {customer.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        {customer.companyName && (
                          <div className="text-sm text-gray-600">{customer.companyName}</div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          {getCustomerStatusBadge(customer.status)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getCustomerTypeIcon(customer.type)}
                        <span className="text-sm text-gray-600 capitalize">{customer.type}</span>
                      </div>
                      {getCustomerTierBadge(customer.customerTier)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Spent:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(customer.totalSpent || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Orders:</span>
                          <span className="font-medium text-gray-900">{customer.totalOrders || 0}</span>
                        </div>
                      </div>
                      {(customer.vehicles?.length || 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Car className="h-3 w-3" />
                          <span>{customer.vehicles?.length} vehicles</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                        {formatDate(customer.lastOrderDate || customer.createdAt)}
                    </div>
                    {(customer.opportunities?.length || 0) > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                        {customer.opportunities?.length} opportunities
                        </div>
                    )}
                  </td>
                  {/* <td className="px-6 py-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onViewCustomer(customer)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditCustomer(customer)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Edit customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCustomer(customer)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, totalCustomers)} of {totalCustomers} customers
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}