'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Building,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
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
  featured?: boolean;
  new?: boolean;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    health: 98.5,
    activeSettings: 156,
    recentChanges: 24,
    pendingActions: 3,
  });

  const menuItems: MenuItem[] = [
    // Featured - Most Used
    {
      id: 'general',
      label: 'General Settings',
      icon: Settings,
      href: '/settings/general',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Basic system configuration and preferences',
      category: 'system',
      featured: true,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      href: '/settings/users',
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-500',
      badge: 3,
      description: 'Manage system users, roles and permissions',
      category: 'administration',
      featured: true,
    },
    {
      id: 'security',
      label: 'Security Center',
      icon: ShieldCheck,
      href: '/settings/security',
      color: 'text-red-600',
      gradient: 'from-red-500 to-orange-500',
      description: 'Configure security and access controls',
      category: 'security',
      featured: true,
    },

    // User Management
    {
      id: 'profiles',
      label: 'Employee Profiles',
      icon: User,
      href: '/settings/profiles',
      color: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500',
      badge: 56,
      description: 'Manage employee information and departments',
      category: 'administration',
    },
    {
      id: 'teams',
      label: 'Team Settings',
      icon: Building,
      href: '/settings/teams',
      color: 'text-indigo-600',
      gradient: 'from-indigo-500 to-violet-500',
      description: 'Configure team structures and permissions',
      category: 'administration',
      new: true,
    },
    
    // Automation
    {
      id: 'workflows',
      label: 'Workflow Automation',
      icon: Workflow,
      href: '/settings/workflows',
      color: 'text-pink-600',
      gradient: 'from-pink-500 to-rose-500',
      badge: 18,
      description: 'Create and manage automated workflows',
      category: 'automation',
      new: true,
    },
    {
      id: 'blueprints',
      label: 'Process Blueprints',
      icon: Layers,
      href: '/settings/blueprints',
      color: 'text-indigo-600',
      gradient: 'from-indigo-500 to-blue-500',
      badge: 9,
      description: 'Design and configure process templates',
      category: 'automation',
    },
    
    // Security & Compliance
    {
      id: 'compliance',
      label: 'Compliance',
      icon: ShieldAlert,
      href: '/settings/compliance',
      color: 'text-amber-600',
      gradient: 'from-amber-500 to-yellow-500',
      description: 'Regulatory compliance and audit trails',
      category: 'security',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellRing,
      href: '/settings/notifications',
      color: 'text-yellow-600',
      gradient: 'from-yellow-500 to-amber-500',
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
      gradient: 'from-teal-500 to-cyan-500',
      badge: 6,
      description: 'Connect with external services and APIs',
      category: 'integration',
    },
    {
      id: 'api',
      label: 'API Management',
      icon: Code,
      href: '/settings/api',
      color: 'text-gray-600',
      gradient: 'from-gray-500 to-gray-600',
      description: 'API keys, documentation, and usage',
      category: 'integration',
    },
    
    // Analytics & Data
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      href: '/settings/analytics',
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-red-500',
      description: 'View reports and system metrics',
      category: 'analytics',
    },
    {
      id: 'data',
      label: 'Data Management',
      icon: Database,
      href: '/settings/data',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-indigo-500',
      description: 'Data export, import, and management',
      category: 'analytics',
    },
    
    // Appearance & Customization
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      href: '/settings/appearance',
      color: 'text-violet-600',
      gradient: 'from-violet-500 to-purple-500',
      description: 'Customize themes and branding',
      category: 'customization',
    },
    {
      id: 'custom-fields',
      label: 'Custom Fields',
      icon: FileCode,
      href: '/settings/custom-fields',
      color: 'text-emerald-600',
      gradient: 'from-emerald-500 to-green-500',
      description: 'Create and manage custom data fields',
      category: 'customization',
    },
    
    // System & Configuration
    {
      id: 'system',
      label: 'System Settings',
      icon: Server,
      href: '/settings/system',
      color: 'text-gray-600',
      gradient: 'from-gray-500 to-slate-500',
      description: 'Configure system preferences and maintenance',
      category: 'system',
    },
    {
      id: 'billing',
      label: 'Billing & Plans',
      icon: CreditCard,
      href: '/settings/billing',
      color: 'text-sky-600',
      gradient: 'from-sky-500 to-blue-500',
      description: 'Subscription and payment management',
      category: 'system',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Settings', icon: Grid, count: menuItems.length },
    { id: 'featured', label: 'Most Used', icon: Sparkles, count: menuItems.filter(i => i.featured).length },
    { id: 'administration', label: 'Administration', icon: Users, count: menuItems.filter(i => i.category === 'administration').length },
    { id: 'automation', label: 'Automation', icon: Workflow, count: menuItems.filter(i => i.category === 'automation').length },
    { id: 'security', label: 'Security', icon: ShieldCheck, count: menuItems.filter(i => i.category === 'security').length },
    { id: 'integration', label: 'Integration', icon: Network, count: menuItems.filter(i => i.category === 'integration').length },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, count: menuItems.filter(i => i.category === 'analytics').length },
    { id: 'customization', label: 'Customization', icon: Palette, count: menuItems.filter(i => i.category === 'customization').length },
    { id: 'system', label: 'System', icon: Settings, count: menuItems.filter(i => i.category === 'system').length },
  ];

  // Get current page info for breadcrumbs
  const currentMenuItem = useMemo(() => {
    return menuItems.find(item => 
      item.href === pathname || pathname.startsWith(`${item.href}/`)
    );
  }, [pathname]);

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Settings', href: '/settings', icon: Settings },
    ];

    if (pathname !== '/settings' && currentMenuItem) {
      breadcrumbs.push({
        label: currentMenuItem.label,
        href: currentMenuItem.href,
        icon: currentMenuItem.icon,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const featuredItems = menuItems.filter(item => item.featured);
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' 
        ? true
        : activeCategory === 'featured'
        ? item.featured
        : item.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const simulateRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setStats(prev => ({
        ...prev,
        recentChanges: prev.recentChanges + 1,
      }));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            {/* Left: Logo and Breadcrumb */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">System Settings</h1>
                <div className="flex items-center gap-1 text-sm text-blue-100 mt-1">
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
              
              <button
                onClick={simulateRefresh}
                disabled={refreshing}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
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
      </div>

      {/* Back to Dashboard Button - Show on specific settings pages */}
      {pathname !== '/settings' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Settings Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        {pathname !== '/settings' && currentMenuItem && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${currentMenuItem.gradient}`}>
                  <currentMenuItem.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentMenuItem.label}</h2>
                  <p className="text-gray-600 mt-1">{currentMenuItem.description}</p>
                </div>
              </div>
              {currentMenuItem.badge && (
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-full">
                  {currentMenuItem.badge} items
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Filters - Only show on settings dashboard */}
        {pathname === '/settings' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings Dashboard</h2>
                <p className="text-gray-600 mt-1">Configure and manage your CRM system settings</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 rounded-lg text-sm">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">System Status:</span>
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Operational
                  </span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Sparkles className="h-4 w-4" />
                  Quick Setup
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Active Settings',
                  value: stats.activeSettings,
                  icon: CheckCircle,
                  gradient: 'from-blue-500 to-cyan-500',
                  trend: '+12% this month',
                  trendColor: 'text-green-600',
                },
                {
                  label: 'System Health',
                  value: `${stats.health}%`,
                  icon: Activity,
                  gradient: 'from-green-500 to-emerald-500',
                  trend: 'All systems operational',
                  trendColor: 'text-green-600',
                },
                {
                  label: 'Recent Changes',
                  value: stats.recentChanges,
                  icon: Clock,
                  gradient: 'from-purple-500 to-pink-500',
                  trend: 'Last 7 days',
                  trendColor: 'text-gray-600',
                },
                {
                  label: 'Pending Actions',
                  value: stats.pendingActions,
                  icon: AlertCircle,
                  gradient: 'from-orange-500 to-red-500',
                  trend: 'Requires attention',
                  trendColor: 'text-orange-600',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index}
                    className="bg-white rounded-2xl p-5 border border-gray-200/50 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}/10 group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-6 w-6 ${stat.gradient.includes('blue') ? 'text-blue-600' : 
                                          stat.gradient.includes('green') ? 'text-green-600' :
                                          stat.gradient.includes('purple') ? 'text-purple-600' : 'text-orange-600'}`} />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className={`text-xs ${stat.trendColor} font-medium flex items-center gap-1`}>
                        {stat.trendColor === 'text-green-600' && <TrendingUp className="h-3 w-3" />}
                        {stat.trend}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Filters */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Categories</h3>
                <div className="text-xs text-gray-500">
                  {filteredMenuItems.length} of {menuItems.length} settings
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 text-blue-700 shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${
                        activeCategory === category.id ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      {category.label}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Settings Grid or Content */}
        {pathname === '/settings' ? (
          <>
            {/* Featured Settings */}
            {activeCategory === 'all' || activeCategory === 'featured' ? (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Most Used Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {featuredItems.map((item) => {
                    const Icon = item.icon;
                    const isActivePage = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`group relative bg-gradient-to-br from-white to-blue-50 border-2 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                          isActivePage
                            ? 'border-blue-500 shadow-lg'
                            : 'border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="absolute top-0 right-0 p-2">
                          <div className={`p-1.5 rounded-lg ${
                            isActivePage
                              ? 'bg-blue-100'
                              : 'bg-gradient-to-r from-blue-50 to-purple-50 group-hover:from-blue-100 group-hover:to-purple-100'
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              isActivePage ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-600'
                            }`} />
                          </div>
                        </div>
                        
                        <div>
                          <div className={`text-lg font-semibold mb-2 ${
                            isActivePage ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {item.label}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">
                            {item.description}
                          </p>
                          
                          <div className={`flex items-center text-sm font-medium ${
                            isActivePage ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                          }`}>
                            <span>Configure now</span>
                            <ArrowRight className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* All Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActivePage = pathname === item.href;
                const isFeatured = item.featured;
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group relative bg-gradient-to-br from-white to-blue-50/30 border rounded-xl p-5 hover:shadow-lg transition-all duration-200 overflow-hidden ${
                      isActivePage
                        ? 'border-blue-300 shadow-md'
                        : 'border-blue-100 hover:border-blue-300'
                    } ${isFeatured ? 'ring-1 ring-blue-200' : ''}`}
                  >
                    {/* Top Badges */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-lg bg-gradient-to-r ${item.gradient}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {item.new && (
                          <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                            New
                          </span>
                        )}
                        {item.badge && (
                          <span className="px-2 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 text-xs font-medium rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className={`text-base font-semibold mb-2 ${
                      isActivePage ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                      <div className={`text-sm font-medium ${
                        isActivePage ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                      }`}>
                        Configure
                      </div>
                      <ChevronRight className={`h-4 w-4 ${
                        isActivePage ? 'text-blue-600' : 'text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5'
                      } transition-transform`} />
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-purple-500/0 group-hover:via-blue-500/5 group-hover:to-purple-500/10 transition-all duration-300 pointer-events-none" />
                  </Link>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredMenuItems.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No settings found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  No settings match your search for "{searchQuery}". Try a different term or browse by category.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        ) : (
          /* Specific Settings Page Content */
          <div className="bg-gradient-to-br from-white via-white to-blue-50/30 border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
            {children}
          </div>
        )}

        {/* Help Section */}
        {pathname === '/settings' && (
          <div className="mt-12 pt-8 border-t border-blue-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  Need help with settings?
                </h3>
                <p className="text-gray-600 mb-6">
                  Our documentation covers everything from basic configuration to advanced customization. 
                  Get started with our step-by-step guides.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 rounded-xl text-sm font-medium transition-all">
                    <BookOpen className="h-4 w-4" />
                    View Documentation
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg rounded-xl text-sm font-medium transition-all">
                    <Headphones className="h-4 w-4" />
                    Contact Support
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-medium transition-colors">
                    <ExternalLink className="h-4 w-4" />
                    API Reference
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Quick Tips
                </h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use categories to quickly find related settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Most used settings are highlighted for quick access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search supports natural language queries</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-blue-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {/* Mobile Search & Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Breadcrumbs in Mobile */}
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-6">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <div key={crumb.href} className="flex items-center gap-1">
                    <Link
                      href={crumb.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:text-gray-900 ${isLast ? 'text-gray-900 font-medium' : ''}`}
                    >
                      {crumb.label}
                    </Link>
                    {!isLast && <ChevronRight className="h-3 w-3" />}
                  </div>
                );
              })}
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-1 mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h4>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 border border-blue-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-2" />
                      <span className="text-xs font-medium">{category.label}</span>
                      <span className="text-xs text-gray-500 mt-1">{category.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</h4>
              <div className="space-y-1">
                {menuItems.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  const isActivePage = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActivePage
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActivePage ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-100'}`}>
                        <Icon className={`h-4 w-4 ${isActivePage ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <span className="font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 rounded-full text-xs">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}