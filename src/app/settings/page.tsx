// app/settings/page.tsx
'use client';

import {
  Settings,
  Users,
  Workflow,
  Layers,
  Shield,
  BarChart3,
  Bell,
  Key,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const quickActions = [
  {
    title: 'User Management',
    description: 'Add, edit, and manage system users',
    icon: Users,
    href: '/settings/users',
    color: 'from-blue-500 to-blue-600',
    requiredPermissions: ['users.manage'],
  },
  {
    title: 'Workflows',
    description: 'Create and manage automation workflows',
    icon: Workflow,
    href: '/settings/workflows',
    color: 'from-purple-500 to-purple-600',
    requiredPermissions: ['workflows.manage'],
  },
  {
    title: 'Blueprints',
    description: 'Design process templates and stages',
    icon: Layers,
    href: '/settings/blueprints',
    color: 'from-green-500 to-green-600',
    requiredPermissions: ['blueprints.manage'],
  },
  {
    title: 'Permissions',
    description: 'Configure role-based access control',
    icon: Shield,
    href: '/settings/permissions',
    color: 'from-orange-500 to-orange-600',
    requiredPermissions: ['permissions.manage'],
  },
];

const systemStatus = [
  { label: 'Users Online', value: '24', change: '+3' },
  { label: 'Active Workflows', value: '18', change: '+2' },
  { label: 'System Uptime', value: '99.9%', change: '0.1%' },
  { label: 'Storage Used', value: '45%', change: '+5%' },
];

export default function SettingsDashboard() {
  const router = useRouter();

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the system settings. Manage all aspects of your CRM from here.
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {systemStatus.map((status) => (
          <div key={status.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">{status.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-800">{status.value}</p>
              <span className={`text-sm ${status.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {status.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="group bg-white border border-gray-200 rounded-xl p-5 text-left hover:shadow-lg transition-all hover:border-transparent"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-2 bg-gradient-to-r ${action.color} rounded-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Recent Activity
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { user: 'John Doe', action: 'created new workflow', time: '5 min ago' },
                { user: 'Jane Smith', action: 'updated user permissions', time: '1 hour ago' },
                { user: 'Mike Johnson', action: 'added new blueprint', time: '2 hours ago' },
                { user: 'Sarah Wilson', action: 'modified notification settings', time: '3 hours ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              System Metrics
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">User Growth</span>
                  <span className="text-sm font-medium text-green-600">+12%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full w-3/4"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Workflow Usage</span>
                  <span className="text-sm font-medium text-blue-600">+24%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-2/3"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Automation Rate</span>
                  <span className="text-sm font-medium text-purple-600">68%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-2/3"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">System Health</span>
                  <span className="text-sm font-medium text-green-600">Excellent</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full w-9/10"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}