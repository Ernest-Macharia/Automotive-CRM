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

      {/* Opportunity Overview Summary */}
      {overviewLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        </div>
      ) : overview ? (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-600 font-semibold">Total Opportunities</p>
              <p className="font-bold text-xl text-gray-900">{overview.total}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-600 font-semibold">New</p>
              <p className="font-bold text-xl text-gray-900">{overview.new}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-600 font-semibold">Qualified</p>
              <p className="font-bold text-xl text-gray-900">{overview.qualified}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-orange-600 font-semibold">Conversion Rate</p>
              <p className="font-bold text-xl text-gray-900">{overview.conversion_rate}%</p>
            </div>
          </div>
          
          {/* Stage Breakdown */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Stage Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-sm text-gray-500">New</div>
                <div className="font-bold text-lg">{overview.new}</div>
                <div className="text-xs text-gray-400">
                  {overview.total > 0 ? Math.round((overview.new / overview.total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Qualified</div>
                <div className="font-bold text-lg">{overview.qualified}</div>
                <div className="text-xs text-gray-400">
                  {overview.total > 0 ? Math.round((overview.qualified / overview.total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Proposal</div>
                <div className="font-bold text-lg">{overview.proposal}</div>
                <div className="text-xs text-gray-400">
                  {overview.total > 0 ? Math.round((overview.proposal / overview.total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Closed</div>
                <div className="font-bold text-lg">{overview.closed}</div>
                <div className="text-xs text-gray-400">
                  {overview.total > 0 ? Math.round((overview.closed / overview.total) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
          <p className="text-gray-500">No overview data available</p>
        </div>
      )}
    </div>
  );
}