'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building, FileText, Receipt, Wallet,
  Truck, ClipboardList, MessageSquare, FileCheck, Handshake,
  Settings, LogOut, X, Bell, Shield, Menu, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem('user');
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (err) {
      console.error('Failed to parse user:', err);
      return null;
    }
  }, []);

  const closeMobile = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    router.push('/auth/login');
  };

  const navItems = [
    { href: '/dashboard',      label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/opportunities',  label: 'Opportunities', icon: Users },
    { href: '/clients',        label: 'Clients',       icon: Building },
    { href: '/quotes',         label: 'Quotes',        icon: FileText },
    { href: '/invoices',       label: 'Invoices',      icon: Receipt },
    { href: '/payments',       label: 'Payments',      icon: Wallet },
    { href: '/vehicles',       label: 'Vehicles',      icon: Truck },
    { href: '/jobcards',       label: 'Job Cards',     icon: ClipboardList },
    { href: '/tickets',        label: 'Tickets',       icon: MessageSquare },
    { href: '/settings',       label: 'Settings',      icon: Settings },
  ];

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-50 w-12 h-12 bg-mag-orange text-white rounded-full shadow-lg flex items-center justify-center hover:bg-mag-amber transition-all duration-200"
      >
        <Menu className="w-6 h-6" />
      </button>
      <aside className="h-screen w-64 flex flex-col bg-mag-charcoal border-r border-mag-border">
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-4" style={{ borderBottom: '1px solid #2A2A2A' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-mag-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MAG CRM</h1>
              <p className="text-xs text-mag-lightgray">v1.0.0</p>
            </div>
          </div>
          <button 
            onClick={closeMobile} 
            className="lg:hidden p-1.5 rounded-lg text-mag-lightgray hover:text-white hover:bg-mag-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <div className="mb-4 px-3">
              <h3 className="text-xs font-semibold text-mag-lightgray uppercase tracking-wider mb-2">Navigation</h3>
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === '/dashboard' 
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMobile}
                      className={`
                        group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${active 
                          ? 'bg-mag-orange text-white shadow-md' 
                          : 'text-mag-lightgray hover:bg-mag-border hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        active ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'
                      }`} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex-shrink-0 p-4 border-t border-mag-border bg-mag-charcoal">
            {user && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-mag-orange rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || user.email?.split('@')[0] || 'User'}</p>
                    <p className="text-xs text-mag-lightgray truncate">{user.email || '—'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-mag-alert/20 text-mag-alert' 
                          : 'bg-mag-orange/20 text-mag-orange'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role || 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-mag-lightgray hover:bg-mag-border hover:text-white transition-colors duration-200 border border-mag-border hover:border-mag-orange"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}