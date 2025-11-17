import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { Target, Wrench, Users, FileText } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Nickson Njeru</h1>
        <p className="text-gray-600 mt-1">Here&apos;s what&apos;s happening with your opportunities today.</p>
      </div>

      {/* Stats Grid */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Opportunities Pipeline */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunities Pipeline</h3>
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new opportunity.</p>
            <div className="mt-6">
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors">
                Create Opportunity
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <RecentActivities />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Target className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">New Opportunity</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Wrench className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Create Work Order</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Add Contact</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Generate Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
}