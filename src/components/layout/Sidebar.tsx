'use client';

import { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { NavigationService } from '@/services/navigationService';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [navItems, setNavItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = sessionStorage.getItem('user');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        
        const filteredItems = NavigationService.getNavItemsForUser(parsedUser);
        setNavItems(filteredItems);
      }
    } catch (err) {
      console.error('Failed to parse user:', err);
    }
  }, []);

  const handleNavigation = useCallback((e: React.MouseEvent) => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    router.push('/auth/login');
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.LayoutDashboard;
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      management: 'Management',
      branch_manager: 'Branch Manager',
      fleet_manager: 'Fleet Manager',
      finance: 'Finance',
      sales_director: 'Sales Director',
      sales_manager: 'Sales Manager',
      sales_lead: 'Sales Lead',
      sales_representative: 'Sales Representative',
      account_executive: 'Account Executive',
      business_development: 'Business Development',
      engineer: 'Engineer',
      technician: 'Technician',
      workshop: 'Workshop',
      support: 'Support Agent',
      customer_service: 'Customer Service',
      dealer: 'Dealer',
      partner: 'Partner',
      insurer: 'Insurer',
      customer: 'Customer',
      developer: 'Developer',
    };
    
    return roleNames[role] || role;
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-sm">
      <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
            <Image
              src="/maglogo.png"
              alt="MAG CRM Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">MAG CRM</h1>
            <p className="text-xs text-gray-500">v1.0.0</p>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Icons.X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2">
        <div className="mb-4 px-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Navigation</h3>
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = getIconComponent(item.icon);
            const active = item.href === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavigation}
                  className={`
                    group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border border-blue-200 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border hover:border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  <Icons.ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${
                    active ? 'translate-x-0 opacity-100 text-blue-500' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60 text-gray-400'
                  }`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50/50">
        {user && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user.name || user.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || '—'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {navItems.length - 1} modules
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:text-gray-800 transition-colors duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
            >
              <Icons.LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}