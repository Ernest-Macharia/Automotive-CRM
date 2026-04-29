'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import { BarChart, Bell, Shield, Workflow } from 'lucide-react';

const cards = [
  {
    title: 'Workflow Automation',
    description: 'Review and improve workflow behavior that drives activity data.',
    href: '/settings/workflows',
    icon: Workflow,
  },
  {
    title: 'Notifications',
    description: 'Tune notification events used in reporting and engagement metrics.',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Permissions',
    description: 'Adjust access to analytics-relevant data and reports.',
    href: '/settings/permissions',
    icon: Shield,
  },
];

export default function AnalyticsSettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart className="h-6 w-6 text-indigo-600" />
              Analytics
            </h2>
            <p className="text-gray-600 mt-1">
              Use these modules to configure the data and activity that analytics depend on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{card.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}

