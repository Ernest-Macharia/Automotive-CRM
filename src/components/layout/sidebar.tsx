// src/components/layout/Sidebar.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building, FileText, Receipt, Wallet,
  Truck, ClipboardList, MessageSquare, FileCheck, Handshake,
  Settings, LogOut, ChevronLeft, ChevronRight, X, Bell, Shield
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ FIX: Remove useEffect and initialize client state properly
  const [isClient] = useState(true); // Since this is a client component

  // ✅ FIX: Only access sessionStorage on client side
  const user = useMemo(() => {
    if (typeof window === 'undefined') return null; // Return null during SSR
    
    try {
      const stored = sessionStorage.getItem('user');
      if (!stored) {
        console.log('No user found in sessionStorage');
        return null;
      }
      const parsed = JSON.parse(stored);
      console.log('User from sessionStorage:', parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to parse user from sessionStorage:', err);
      return null;
    }
  }, []); // Remove isClient dependency

  // ✅ FIX: Remove unused variable
  // const userRoles = user?.role ? [user.role] : [];
  const isAdmin = user?.role === 'admin';
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '—';

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  // ALL NAV ITEMS - Show everything to logged-in users
  const allNavItems: NavItem[] = [
    { href: '/',               label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/opportunities',  label: 'Opportunities', icon: Users },
    { href: '/clients',        label: 'Clients',       icon: Building },
    { href: '/quotes',         label: 'Quotes',        icon: FileText },
    { href: '/invoices',       label: 'Invoices',      icon: Receipt },
    { href: '/payments',       label: 'Payments',      icon: Wallet },
    { href: '/vehicles',       label: 'Vehicles',      icon: Truck },
    { href: '/jobcards',       label: 'Job Cards',     icon: ClipboardList },
    { href: '/tickets',        label: 'Tickets',       icon: MessageSquare },
    { href: '/waivers',        label: 'Waivers',       icon: FileCheck },
    { href: '/partners',       label: 'Partners',      icon: Handshake },
    { href: '/users',          label: 'Users',         icon: Users },
    { href: '/roles',          label: 'Roles',         icon: Shield },
    { href: '/reports',        label: 'Reports',       icon: FileText },
    { href: '/notifications',  label: 'Notifications', icon: Bell },
    { href: '/settings',       label: 'Settings',      icon: Settings },
  ];

  // ✅ FIX: Show all items during development (remove user check)
  const navItems = allNavItems; // Show all items always for development

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={closeMobile} />
      )}

      <aside
        className={`
          ${mobileOpen ? 'fixed' : 'sticky'} 
          top-0 left-0 h-screen z-50 flex flex-col bg-gray-900 border-r border-gray-700
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            {!collapsed && <h1 className="text-xl font-bold text-white">MAG CRM</h1>}
          </div>
          <button onClick={closeMobile} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-none">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // ✅ FIX: Dashboard should only be active on exact home path
              const active = item.href === '/' 
                ? pathname === '/'  // Dashboard: exact match
                : pathname.startsWith(item.href); // Others: starts with
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${active 
                        ? 'bg-orange-500 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                    title={collapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
                  <p className="text-xs text-orange-400">
                    {isAdmin ? 'Admin' : user.role || 'User'}
                  </p>
                </div>
              )}
            </div>
          )}

          {!user && !collapsed && (
            <div className="text-center p-2 bg-yellow-900 text-yellow-200 rounded text-sm">
              Not logged in
            </div>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>Logout</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-30 lg:hidden w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90"
      >
        <LayoutDashboard className="w-6 h-6" />
      </button>
    </>
  );
}