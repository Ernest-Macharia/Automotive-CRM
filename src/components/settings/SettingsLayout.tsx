// components/settings/SettingsLayout.tsx
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Users,
  Settings,
  Shield,
  Workflow,
  FileText,
  User,
  ChevronRight,
  Home,
  BarChart3,
  Bell,
  Key,
  Layers,
  Briefcase,
} from 'lucide-react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/settings',
    requiredPermissions: ['settings.read'],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    href: '/settings/users',
    requiredPermissions: ['users.manage'],
    subItems: [
      { 
        id: 'users-list', 
        label: 'All Users', 
        href: '/settings/users',
        requiredPermissions: ['users.read'] 
      },
      { 
        id: 'roles', 
        label: 'Roles & Permissions', 
        href: '/settings/users/roles',
        requiredPermissions: ['roles.manage'] 
      },
    ],
  },
  {
    id: 'profiles',
    label: 'Employee Profiles',
    icon: User,
    href: '/settings/profiles',
    requiredPermissions: ['profiles.manage'],
    subItems: [
      { 
        id: 'all-profiles', 
        label: 'All Profiles', 
        href: '/settings/profiles',
        requiredPermissions: ['profiles.read'] 
      },
      { 
        id: 'my-profile', 
        label: 'My Profile', 
        href: '/settings/profiles/me',
        requiredPermissions: ['profile.read'] 
      },
      { 
        id: 'departments', 
        label: 'Departments', 
        href: '/settings/profiles/departments',
        requiredPermissions: ['profiles.read'] 
      },
    ],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    href: '/settings/workflows',
    requiredPermissions: ['workflows.manage'],
  },
  {
    id: 'blueprints',
    label: 'Blueprints',
    icon: Layers,
    href: '/settings/blueprints',
    requiredPermissions: ['blueprints.manage'],
  },
  {
    id: 'permissions',
    label: 'Permissions',
    icon: Shield,
    href: '/settings/permissions',
    requiredPermissions: ['permissions.manage'],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Key,
    href: '/settings/security',
    requiredPermissions: ['security.manage'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    href: '/settings/notifications',
    requiredPermissions: ['notifications.manage'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/settings/analytics',
    requiredPermissions: ['analytics.manage'],
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleMenuClick = (itemId: string, href: string) => {
    if (expandedMenu === itemId) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(itemId);
    }
    router.push(href);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Settings</h1>
              <p className="text-blue-100 text-sm mt-1">
                Configure and manage your CRM system
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 via-blue-100/30 to-purple-50/20">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Settings Menu
                </h2>
              </div>
              
              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = isActive(item.href);
                  const isExpanded = expandedMenu === item.id;
                  
                  return (
                    <div key={item.id} className="mb-1">
                      <button
                        onClick={() => handleMenuClick(item.id, item.href)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                          isItemActive
                            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 border border-blue-200/50'
                            : 'hover:bg-gray-50/70 text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${
                            isItemActive ? 'text-blue-500' : 'text-gray-500'
                          }`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        {item.subItems && (
                          <ChevronRight className={`h-4 w-4 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          } ${isItemActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        )}
                      </button>
                      
                      {item.subItems && isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => router.push(subItem.href)}
                              className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                                isActive(subItem.href)
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">System Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm font-semibold text-blue-600">42</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Workflows</span>
                  <span className="text-sm font-semibold text-purple-600">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blueprints</span>
                  <span className="text-sm font-semibold text-green-600">9</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profiles</span>
                  <span className="text-sm font-semibold text-orange-600">56</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}