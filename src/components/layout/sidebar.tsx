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
  permission: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // GET USER FROM LOCAL STORAGE
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('admin');

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // ALL MENU ITEMS WITH REQUIRED PERMISSION
  const allNavItems: NavItem[] = [
    { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, permission: 'dashboard.view' },
    { href: '/opportunities', label: 'Opportunities', icon: Users,          permission: 'opportunities.read' },
    { href: '/clients',       label: 'Clients',       icon: Building,       permission: 'clients.read' },
    { href: '/quotes',        label: 'Quotes',        icon: FileText,       permission: 'quotes.read' },
    { href: '/invoices',      label: 'Invoices',      icon: Receipt,        permission: 'invoices.read' },
    { href: '/payments',      label: 'Payments',      icon: Wallet,         permission: 'invoices.pay' },
    { href: '/vehicles',      label: 'Vehicles',      icon: Truck,          permission: 'vehicles.manage' },
    { href: '/jobcards',      label: 'Job Cards',     icon: ClipboardList,  permission: 'jobcards.read' },
    { href: '/tickets',       label: 'Tickets',       icon: MessageSquare,  permission: 'tickets.read' },
    { href: '/waivers',       label: 'Waivers',       icon: FileCheck,      permission: 'waivers.read' },
    { href: '/partners',      label: 'Partners',      icon: Handshake,      permission: 'partner.clients.read' },
    { href: '/users',         label: 'Users',         icon: Users,          permission: 'users.read' },
    { href: '/roles',         label: 'Roles',         icon: Shield,         permission: 'roles.manage' },
    { href: '/reports',       label: 'Reports',       icon: FileText,       permission: 'reports.generate' },
    { href: '/notifications', label: 'Notifications', icon: Bell,           permission: 'notifications.read' },
    { href: '/settings',      label: 'Settings',      icon: Settings,       permission: 'settings.manage' },
  ];

  // FILTER BY USER ROLES
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      if (item.permission === 'notifications.read') return true;
      if (isAdmin) return true;
      return userRoles.some(role => {
        const allowed = PERMISSIONS[item.permission];
        return allowed?.includes(role);
      });
    });
  }, [userRoles, isAdmin]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={closeMobile} />
      )}

      {/* Sidebar */}
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
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
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${active 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
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

        {/* Collapse + Logout */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-30 lg:hidden w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90"
      >
        <LayoutDashboard className="w-6 h-6" />
      </button>
    </>
  );
}