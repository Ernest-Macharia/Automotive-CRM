'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import { Palette, Bell, Building2, Settings } from 'lucide-react';

const cards = [
  {
    title: 'Notifications',
    description: 'Adjust visibility and alert behavior for users.',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Organizations',
    description: 'Update organization-level branding and profile details.',
    href: '/settings/organizations',
    icon: Building2,
  },
  {
    title: 'System Settings',
    description: 'Go to global configuration controls.',
    href: '/settings/system',
    icon: Settings,
  },
];

export default function AppearanceSettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="h-6 w-6 text-purple-600" />
              Appearance
            </h2>
            <p className="text-gray-600 mt-1">
              Manage UI-related configuration using the available settings modules.
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
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Icon className="h-5 w-5 text-purple-600" />
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

