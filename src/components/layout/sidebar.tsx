'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  Wrench, 
  FileText,
  Settings,
  BarChart3,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Opportunities', href: '/opportunities', icon: Target },
  { name: 'Work Orders', href: '/work-orders', icon: Wrench },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-gray-700">
      {/* Logo - Elevated with your brand color */}
      <div className="flex h-20 items-center justify-center border-b border-gray-600 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-text">MAG CRM</h1>
            <p className="text-xs text-gray-400">Automotive Solutions</p>
          </div>
        </div>
      </div>
      
      {/* Navigation - Professional with hover states */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-sidebar-accent text-white shadow-lg'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} ${isActive ? 'rotate-90' : ''}`} />
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-gray-600 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold text-sm">NN</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-text truncate">Nickson Njeru</p>
            <p className="text-xs text-gray-400 truncate">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}