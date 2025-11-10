// src/components/layout/header.tsx
'use client';

import { useState } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  ChevronDown,
  User,
  LogOut,
  Settings,
  HelpCircle
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Get current page title from pathname
  const getPageTitle = () => {
    const routes: { [key: string]: string } = {
      '/': 'Dashboard',
      '/customers': 'Customers',
      '/vehicles': 'Vehicles',
      '/appointments': 'Appointments',
      '/services': 'Services',
      '/estimates': 'Estimates',
      '/messages': 'Messages',
      '/reports': 'Reports',
      '/settings': 'Settings',
    };
    return routes[pathname] || 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      {/* Page title and breadcrumb */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <div className="w-full">
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500">
              Welcome back, John! Here's what's happening today.
            </p>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden sm:block">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-64 rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative rounded-lg bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              3
            </span>
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-x-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">Nick cheru</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </button>

            {/* Dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">John Doe</div>
                    <div className="text-xs text-gray-500">john.doe@magcrm.com</div>
                  </div>
                  
                  <div className="py-1">
                    <a
                      href="/profile"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Your Profile
                    </a>
                    <a
                      href="/settings"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </a>
                    <a
                      href="/help"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                      <HelpCircle className="h-4 w-4 mr-3" />
                      Help & Support
                    </a>
                  </div>
                  
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={() => console.log('Sign out')}
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
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