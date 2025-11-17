'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'success',
    title: 'Quote approved',
    description: 'Brake pad replacement for KDA 123A',
    time: '2 hours ago',
    icon: CheckCircle,
  },
  {
    id: 2,
    type: 'warning', 
    title: 'New opportunity',
    description: 'Service request - Oil change',
    time: '4 hours ago',
    icon: AlertCircle,
  },
  {
    id: 3,
    type: 'error',
    title: 'Quote declined',
    description: 'Wheel alignment for KBC 456B',
    time: '1 day ago',
    icon: XCircle,
  },
  {
    id: 4,
    type: 'info',
    title: 'Work order completed',
    description: 'Engine diagnostics for KCD 789C',
    time: '2 days ago',
    icon: CheckCircle,
  },
];

export function RecentActivities() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          const colorClasses = {
            success: 'text-green-500',
            warning: 'text-yellow-500',
            error: 'text-red-500',
            info: 'text-blue-500',
          };

          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${colorClasses[activity.type as keyof typeof colorClasses]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
              <div className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500">
                {activity.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}