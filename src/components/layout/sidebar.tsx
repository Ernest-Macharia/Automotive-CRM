'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleItem = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-gray-700 transition-all duration-300 w-20 hover:w-64">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-gray-600 px-4">
        <div className="flex items-center space-x-3 overflow-hidden transition-all duration-300">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div className={`transition-all duration-300 ${expandedItem || 'opacity-0 w-0'} overflow-hidden`}>
            <h1 className="text-xl font-bold text-sidebar-text">MAG CRM</h1>
            <p className="text-xs text-gray-400">Automotive Solutions</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-1 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isExpanded = expandedItem === item.name;

          return (
            <div
              key={item.name}
              className={`flex items-center justify-start rounded-lg px-2 py-3 cursor-pointer group`}
              onClick={() => toggleItem(item.name)}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              <span
                className={`ml-3 text-sm font-medium text-sidebar-text transition-all duration-300 overflow-hidden ${
                  isExpanded || isActive ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                }`}
              >
                {item.name}
              </span>
              <ChevronRight
                className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? 'rotate-90 text-white' : 'text-gray-500 group-hover:text-white'}`}
              />
            </div>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-gray-600 p-4 flex items-center overflow-hidden">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-semibold text-sm">NN</span>
        </div>
        <div className={`flex-1 min-w-0 ml-3 transition-all duration-300 ${expandedItem ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
          <p className="text-sm font-medium text-sidebar-text truncate">Nickson Njeru</p>
          <p className="text-xs text-gray-400 truncate">Admin</p>
        </div>
      </div>
    </div>
  );
}
