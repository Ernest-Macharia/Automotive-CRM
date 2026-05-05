'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  Home,
  ChevronRight,
  Users,
  Workflow,
  Layers,
  Shield,
  Server,
  Palette,
  Network,
  Bell,
  BarChart,
  Database,
  ShieldCheck,
  Key,
  Globe,
  FileText,
  Zap,
  Cpu,
} from 'lucide-react';

interface SettingsLayoutWrapperProps {
  children: ReactNode;
}

// Map page names to their icons
const pageIcons: Record<string, any> = {
  users: Users,
  workflows: Workflow,
  blueprints: Layers,
  permissions: Shield,
  system: Server,
  appearance: Palette,
  integrations: Network,
  notifications: Bell,
  webforms: FileText,
  analytics: BarChart,
  database: Database,
  security: ShieldCheck,
  'api-keys': Key,
  internationalization: Globe,
  templates: FileText,
  performance: Zap,
  backups: Database,
  'system-logs': Cpu,
};

export default function SettingsLayoutWrapper({ children }: SettingsLayoutWrapperProps) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Settings', href: '/settings', icon: Settings },
    ];

    // Check if we're on a sub-page
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      // We're on a settings sub-page
      const pageName = pathParts[1];
      const formattedName = pageName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Get the appropriate icon for this page, fallback to Settings icon
      const PageIcon = pageIcons[pageName] || Settings;
      
      breadcrumbs.push({
        label: formattedName,
        href: `/settings/${pageName}`,
        icon: PageIcon,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header with Blue-Purple Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            {/* Left: Logo and Breadcrumb */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">System Settings</h1>
                <div className="flex items-center gap-1 text-sm text-blue-100/90 mt-1">
                  {breadcrumbs.map((crumb, index) => {
                    const Icon = crumb.icon;
                    const isLast = index === breadcrumbs.length - 1;
                    
                    return (
                      <div key={crumb.href} className="flex items-center gap-1">
                        <Link
                          href={crumb.href}
                          className={`flex items-center gap-1 hover:text-white transition-colors ${
                            isLast ? 'text-white font-medium' : ''
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{crumb.label}</span>
                        </Link>
                        {!isLast && (
                          <ChevronRight className="h-3 w-3 text-blue-200" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Back to Dashboard */}
            {pathname !== '/settings' && (
              <div className="flex items-center gap-3">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl text-sm text-white transition-colors border border-white/30"
                >
                  <Settings className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {children}
    </div>
  );
}
