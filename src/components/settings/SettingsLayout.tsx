'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Settings,
  Shield,
  Workflow,
  User,
  ChevronRight,
  Home,
  BarChart3,
  Bell,
  Key,
  Layers,
  Server,
  Mail,
  Zap,
  Grid,
  Database,
  Palette,
  Network,
  TrendingUp,
  ShieldCheck,
  BellRing,
  Menu,
  X,
  Search,
  Filter,
  ChevronDown,
  Globe,
  FolderTree,
  Cloud,
  Lock,
  Code,
  Terminal,
  Wrench,
  Download,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Cpu,
  HardDrive,
  FileCode,
  Headphones,
  CreditCard,
  Target,
  Loader2,
} from 'lucide-react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  color: string;
  gradient: string;
  badge?: number | string;
  description?: string;
  category?: string;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const menuItems: MenuItem[] = [
    // User Management
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      href: '/settings/users',
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600',
      badge: 3,
      description: 'Manage system users, roles and permissions',
      category: 'administration',
    },
    {
      id: 'profiles',
      label: 'Employee Profiles',
      icon: User,
      href: '/settings/profiles',
      color: 'text-green-600',
      gradient: 'from-green-500 to-green-600',
      badge: 56,
      description: 'Manage employee information and departments',
      category: 'administration',
    },
    
    // Automation
    {
      id: 'workflows',
      label: 'Workflow Automation',
      icon: Workflow,
      href: '/settings/workflows',
      color: 'text-pink-600',
      gradient: 'from-pink-500 to-pink-600',
      badge: 18,
      description: 'Create and manage automated workflows',
      category: 'automation',
    },
    {
      id: 'blueprints',
      label: 'Process Blueprints',
      icon: Layers,
      href: '/settings/blueprints',
      color: 'text-indigo-600',
      gradient: 'from-indigo-500 to-indigo-600',
      badge: 9,
      description: 'Design and configure process templates',
      category: 'automation',
    },
    
    // Security & Compliance
    {
      id: 'security',
      label: 'Security Settings',
      icon: ShieldCheck,
      href: '/settings/security',
      color: 'text-red-600',
      gradient: 'from-red-500 to-red-600',
      description: 'Configure security and access controls',
      category: 'security',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellRing,
      href: '/settings/notifications',
      color: 'text-yellow-600',
      gradient: 'from-yellow-500 to-yellow-600',
      description: 'Manage notification channels and templates',
      category: 'security',
    },
    
    // Integration & API
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Network,
      href: '/settings/integrations',
      color: 'text-teal-600',
      gradient: 'from-teal-500 to-teal-600',
      badge: 6,
      description: 'Connect with external services and APIs',
      category: 'integration',
    },
    
    // Analytics & Data
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      href: '/settings/analytics',
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-orange-600',
      description: 'View reports and system metrics',
      category: 'analytics',
    },
    
    // Appearance & Customization
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      href: '/settings/appearance',
      color: 'text-violet-600',
      gradient: 'from-violet-500 to-violet-600',
      description: 'Customize themes and branding',
      category: 'customization',
    },
    
    // System & Configuration
    {
      id: 'system',
      label: 'System Settings',
      icon: Server,
      href: '/settings/system',
      color: 'text-gray-600',
      gradient: 'from-gray-500 to-gray-600',
      description: 'Configure system preferences and maintenance',
      category: 'system',
    },
    {
      id: 'general',
      label: 'General Settings',
      icon: Settings,
      href: '/settings/general',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
      description: 'Basic system configuration and preferences',
      category: 'system',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Settings', count: menuItems.length },
    { id: 'administration', label: 'Administration', count: menuItems.filter(i => i.category === 'administration').length },
    { id: 'automation', label: 'Automation', count: menuItems.filter(i => i.category === 'automation').length },
    { id: 'security', label: 'Security', count: menuItems.filter(i => i.category === 'security').length },
    { id: 'integration', label: 'Integration', count: menuItems.filter(i => i.category === 'integration').length },
    { id: 'analytics', label: 'Analytics', count: menuItems.filter(i => i.category === 'analytics').length },
    { id: 'customization', label: 'Customization', count: menuItems.filter(i => i.category === 'customization').length },
    { id: 'system', label: 'System', count: menuItems.filter(i => i.category === 'system').length },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => 
      item.href === pathname || pathname.startsWith(`${item.href}/`)
    );
    return currentItem?.label || 'Settings';
  };

  const getPageDescription = () => {
    const currentItem = menuItems.find(item => 
      item.href === pathname || pathname.startsWith(`${item.href}/`)
    );
    return currentItem?.description || 'Configure your CRM system';
  };

  const getPageIcon = () => {
    const currentItem = menuItems.find(item => 
      item.href === pathname || pathname.startsWith(`${item.href}/`)
    );
    return currentItem?.icon || Settings;
  };

  const PageIcon = getPageIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Blue to Purple Gradient Header */}
      <div className="h-20 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">MAG Settings</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100 text-sm">
                  {statsLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading stats...
                    </span>
                  ) : stats ? (
                    <>
                      {stats.totalopportunities || 156} total opportunities
                    </>
                  ) : (
                    'Track and manage your CRM settings'
                  )}
                </p>
                {refreshing && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-200" />
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-sm text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
            
            <button className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors">
              <RefreshCw className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">

          {/* Category Filters - Only show when not on a specific settings page */}
          {pathname === '/settings' ? (
            
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {category.label}
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                      activeCategory === category.id
                        ? 'bg-white/20'
                        : 'bg-gray-100'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
          ) : null}
        </div>

        {/* Settings Grid or Content */}
        {pathname === '/settings' ? (
          <div className="mb-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Active Settings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% this month
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-green-50 border border-green-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">System Health</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">98.5%</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-100">
                  <div className="text-xs text-green-600 font-medium">
                    All systems operational
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Recent Changes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-100">
                  <div className="text-xs text-gray-600">
                    Last 7 days
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-orange-50 border border-orange-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Pending Actions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">3</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-orange-100">
                  <div className="text-xs text-orange-600 font-medium">
                    Requires attention
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActivePage = isActive(item.href);
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group relative bg-gradient-to-br from-white to-gray-50 border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                      isActivePage
                        ? 'border-blue-300 shadow-lg'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    {/* Gradient accent */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      isActivePage
                        ? 'bg-gradient-to-b from-blue-500 to-purple-500'
                        : 'bg-gradient-to-b from-gray-300 to-gray-400 group-hover:from-blue-400 group-hover:to-purple-400'
                    }`} />
                    
                    <div className="ml-2">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${
                          isActivePage
                            ? `bg-gradient-to-r ${item.gradient}`
                            : `bg-gradient-to-r ${item.gradient}/10`
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            isActivePage ? 'text-white' : item.color
                          }`} />
                        </div>
                        
                        {item.badge && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isActivePage
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      
                      <h3 className={`text-lg font-semibold mb-2 ${
                        isActivePage ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {item.description}
                      </p>
                      
                      <div className={`flex items-center text-sm font-medium ${
                        isActivePage ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                      }`}>
                        <span>Configure</span>
                        <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* Specific Settings Page Content */
          <div className="bg-gradient-to-br from-white via-white to-gray-50/30 border border-gray-200/50 rounded-3xl shadow-xl overflow-hidden">
            {children}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">CRM System Settings</span>
              <span className="mx-2">•</span>
              <span>Version 2.1.0</span>
              <span className="mx-2">•</span>
              <span>Last updated: Today, 10:30 AM</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Privacy Policy
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Terms of Service
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Search Settings</h3>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActivePage = isActive(item.href);
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isActivePage
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActivePage ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}