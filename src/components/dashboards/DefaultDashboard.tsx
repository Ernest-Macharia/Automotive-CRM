// components/dashboards/DefaultDashboard.tsx
'use client';

import { BarChart3, Users, FileText, Settings } from 'lucide-react';

interface DefaultDashboardProps {
  user?: any;
}

export default function DefaultDashboard({ user }: DefaultDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to MAG CRM</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <BarChart3 className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-sm text-gray-600">View your performance metrics</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Users className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Team</h3>
          <p className="text-sm text-gray-600">Connect with your team</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <FileText className="h-8 w-8 text-purple-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
          <p className="text-sm text-gray-600">Access important files</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Settings className="h-8 w-8 text-amber-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
          <p className="text-sm text-gray-600">Configure your preferences</p>
        </div>
      </div>
    </div>
  );
}