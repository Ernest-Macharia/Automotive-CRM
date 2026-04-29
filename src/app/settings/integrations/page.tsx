'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import { Bell, Network, Shield, Workflow } from 'lucide-react';

const cards = [
  {
    title: 'Workflow Automation',
    description: 'Connect and automate internal process flows.',
    href: '/settings/workflows',
    icon: Workflow,
  },
  {
    title: 'Permissions',
    description: 'Control access for connected services and teams.',
    href: '/settings/permissions',
    icon: Shield,
  },
  {
    title: 'Notifications',
    description: 'Configure delivery channels and alert rules.',
    href: '/settings/notifications',
    icon: Bell,
  },
];

export default function IntegrationsSettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Network className="h-6 w-6 text-orange-600" />
              Integrations
            </h2>
            <p className="text-gray-600 mt-1">
              Open the available configuration areas for integrations and automation.
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
                    <div className="p-2 rounded-lg bg-orange-50">
                      <Icon className="h-5 w-5 text-orange-600" />
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

