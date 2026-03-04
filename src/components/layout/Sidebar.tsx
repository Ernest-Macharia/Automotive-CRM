// components/layout/Sidebar.tsx
'use client';

import { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { NavigationService } from '@/services/navigationService';
import { organizationService } from '@/services/settings/organizationService';
import { userService } from '@/services/settings/userService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { authService } from '@/services/authService';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [navItems, setNavItems] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { user, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (user) {
      const filteredItems = NavigationService.getNavItemsForUser(user);
      setNavItems(filteredItems);

      const organizationId = (user as any).organizationId || 
                            (user as any).organization?._id || 
                            (user as any).organization?.id;
      
      const organizationName = (user as any).organizationName || 
                               (user as any).organization?.name;

      if (organizationId) {
        fetchOrganization(organizationId);
      } else if (organizationName) {
        setOrganization({ name: organizationName });
      }
    }
  }, [user]);

  const fetchOrganization = async (organizationId: string) => {
    setIsLoadingOrg(true);
    try {
      const orgData = await organizationService.getOrganizationById(organizationId);
      setOrganization(orgData);
    } catch (err) {
      console.error('Failed to fetch organization:', err);
      try {
        const stored = sessionStorage.getItem('user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          if (parsedUser.organizationName) {
            setOrganization({ name: parsedUser.organizationName });
          }
        }
      } catch (fallbackErr) {
        console.error('Failed to parse fallback organization data:', fallbackErr);
      }
    } finally {
      setIsLoadingOrg(false);
    }
  };

  const handleNavigation = useCallback((e: React.MouseEvent) => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/auth/login');
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.LayoutDashboard;
  };

  const getTierBadgeColor = (tier?: string) => {
    return organizationService.getTierBadgeColor(tier || 'basic');
  };

  const getUserInitial = () => {
    if (!user) return 'U';
    const displayName = userService.getUserDisplayName(user);
    return displayName.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return userService.getUserDisplayName(user);
  };

  const getUserRoleDisplayName = () => {
    if (!user) return 'Unknown Role';
    return userService.getUserRoleDisplayName(user);
  };

  if (userLoading) {
    return (
      <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-sm">
        <div className="flex-shrink-0 h-16 px-4 border-b border-gray-200 bg-white flex items-center">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Header with Organization Name */}
      <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            {organization?.logo ? (
              <Image
                src={organization.logo}
                alt={organization.name}
                width={32}
                height={32}
                className="object-contain rounded"
              />
            ) : (
              <Image
                src="/maglogo.png"
                alt="VIN17x CRM Logo"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-800 truncate flex items-center gap-2">
              {isLoadingOrg ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                organization?.name || 'VIN17x CRM'
              )}
              {organization?.tier && !isLoadingOrg && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadgeColor(organization.tier)}`}>
                  {organization.tier}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {organization?.slug ? `${organization.slug}.vin17x.com` : 'v1.0.0'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Icons.X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Items - takes all available space */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <div className="mb-4 px-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">MAIN MENU</h3>
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
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="truncate">{item.label}</span>
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

      {/* User Profile Section - Fixed at bottom */}
      {user && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          <div className="relative p-4">
            {/* Main user info - clickable to toggle menu */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm">
                {getUserInitial()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {getUserRoleDisplayName()}
                </p>
              </div>
              <Icons.ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                showUserMenu ? 'rotate-180' : ''
              }`} />
            </button>

            {/* User Menu Dropdown - appears above the user section */}
            {showUserMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  href="/my-profile"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icons.User className="w-4 h-4 text-gray-400" />
                  <span>My Profile</span>
                </Link>
                
                <Link
                  href="/settings"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icons.Settings className="w-4 h-4 text-gray-400" />
                  <span>Settings</span>
                </Link>

                <Link
                  href="/help"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icons.HelpCircle className="w-4 h-4 text-gray-400" />
                  <span>Help & Support</span>
                </Link>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icons.LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Online status indicator */}
            <div className="mt-2 flex items-center gap-2 px-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
