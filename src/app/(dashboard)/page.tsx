// src/app/(dashboard)/page.tsx
'use client';

import { StatsCards } from '@/components/dashboard/stats-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { useOpportunityOverview } from '@/hooks/useOpportunities';

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useOpportunityOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your MAG CRM dashboard</p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts & Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-1">
          <RecentActivities />
        </div>
      </div>

      {/* Optional: Overview Summary */}
      {overviewLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pipeline Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Value</p>
              <p className="font-bold text-xl">
                {overview?.currency || 'KES'} {overview?.totalValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Deals</p>
              <p className="font-bold text-xl">{overview?.byType.deal}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}