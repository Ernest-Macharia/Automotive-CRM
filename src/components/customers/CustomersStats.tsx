import React from 'react';
import { Users, DollarSign, UserPlus, Tag, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import { CustomerStats } from '@/services/customersService';
import { Building2, User } from 'lucide-react';

interface CustomersStatsProps {
  stats: CustomerStats | null;
  loading?: boolean;
}

export default function CustomersStats({ stats, loading = false }: CustomersStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Safely get individual and organization counts
  const individualCount = stats?.byType?.find(t => t._id === 'individual')?.count || 0;
  const organizationCount = stats?.byType?.find(t => t._id === 'organization')?.count || 0;

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3.5 w-24 bg-gray-200 rounded" />
                  <div className="h-7 w-28 bg-gray-300 rounded" />
                </div>
                <div className="p-2.5 bg-gray-100 rounded-lg">
                  <div className="h-5 w-5 bg-gray-300 rounded" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-gray-200 rounded" />
                  <div className="h-2.5 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalCustomers.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span>{stats.activeCustomers || 0} active</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalRevenue || 0)}
              </h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span>Avg: {formatCurrency(stats.averageOrderValue || 0)} per customer</span>
            </div>
          </div>
        </div>

        {/* New This Month */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.newCustomersThisMonth || 0}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>From opportunities</span>
            </div>
          </div>
        </div>

        {/* Customer Types */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Types</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{individualCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{organizationCount}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Tag className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}