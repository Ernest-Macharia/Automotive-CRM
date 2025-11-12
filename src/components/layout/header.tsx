// src/components/layout/header.tsx
'use client';

import { useState, useEffect } from 'react';
import { Menu, Bell, Search, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { authService } from '@/services/authService';
import Image from 'next/image';
import { useUnreadCount } from '@/hooks/useNotifications';

export function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { data: user, isLoading } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { data: unreadCount = 0 } = useUnreadCount();

  // EAT Time (UTC+3)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const eatTime = new Intl.DateTimeFormat('en-KE', {
        timeZone: 'Africa/Nairobi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
      setCurrentTime(eatTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/': 'Dashboard',
      '/opportunities': 'Opportunities',
      '/contacts': 'Contacts',
      '/work-orders': 'Work Orders',
      '/quotes': 'Quotes',
      '/reports': 'Reports',
      '/settings': 'Settings',
    };
    return routes[pathname] || 'Dashboard';
  };

  const getInitials = () => {
    if (isLoading || !user?.firstName || !user?.lastName) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getFullName = () => {
    if (isLoading) return 'Loading...';
    if (!user) return 'Guest User';
    return `${user.firstName} ${user.lastName}`;
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>

      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="w-full">
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Loading...' : `Welcome back, ${user?.firstName || 'User'}!`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Kenya Flag + EAT Time */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <Image
              src="/kenya-flag.svg"
              alt="Kenya"
              width={20}
              height={15}
              className="rounded-sm"
            />
            <span className="font-medium">{currentTime} EAT</span>
          </div>

          <div className="hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <button className="relative p-2 text-gray-400 hover:text-gray-500">
            <Bell className="h-6 w-6" />
           <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
  {unreadCount}
</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-xs">
                {getInitials()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900">{getFullName()}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{getFullName()}</div>
                    <div className="text-xs text-gray-500">{user?.email || 'user@crm.local'}</div>
                  </div>
                  <div className="py-1">
                    <a href="/profile" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="h-4 w-4 mr-3" /> Profile
                    </a>
                    <a href="/settings" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings className="h-4 w-4 mr-3" /> Settings
                    </a>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}