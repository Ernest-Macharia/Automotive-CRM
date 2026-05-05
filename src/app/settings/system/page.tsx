'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';
import { Building2, Users, Shield, Bell, Workflow, Layers, FileText } from 'lucide-react';

const cards = [
  {
    title: 'Organizations',
    description: 'Manage organization-level configuration, billing, and domains.',
    href: '/settings/organizations',
    icon: Building2,
  },
  {
    title: 'User Management',
    description: 'Control users, access levels, and assignments.',
    href: '/settings/users',
    icon: Users,
  },
  {
    title: 'Permissions',
    description: 'Configure role-based permissions and security access.',
    href: '/settings/permissions',
    icon: Shield,
  },
  {
    title: 'Notifications',
    description: 'Set up notification behavior for users and teams.',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Workflow Automation',
    description: 'Configure system process automation and transitions.',
    href: '/settings/workflows',
    icon: Workflow,
  },
  {
    title: 'Process Blueprints',
    description: 'Define reusable business process templates.',
    href: '/settings/blueprints',
    icon: Layers,
  },
  {
    title: 'Web Forms',
    description: 'Build and publish versioned forms, templates, and submission workflows.',
    href: '/settings/webforms',
    icon: FileText,
  },
];

export default function SystemSettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <p className="text-gray-600 mt-1">
              Use these modules to configure system-wide behavior.
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
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-600" />
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
