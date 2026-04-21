'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { NavigationService } from '@/services/navigationService';
import { organizationService } from '@/services/settings/organizationService';
import { userService } from '@/services/settings/userService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { authService } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [navItems, setNavItems] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fetchedOrganizationIdRef = useRef<string | null>(null);
  
  const { user, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (user) {
      const filteredItems = NavigationService.getNavItemsForUser(user);
      setNavItems(filteredItems);

      const organizationId = (user as any).organizationId || 
                            (user as any).organization?._id || 
                            (user as any).organization?.id;
      
      const authUser = authService.getUser() as any;
      const organizationName = (user as any).organizationName || 
                               (user as any).organization?.name ||
                               authUser?.organizationName ||
                               authUser?.organization?.name ||
                               authUser?.companyName;

      const organizationSlug = (user as any).organization?.slug ||
                               authUser?.organization?.slug;

      const organizationTier = (user as any).organization?.tier ||
                               authUser?.organization?.tier;

      const organizationLogo = (user as any).organization?.logo ||
                               authUser?.organization?.logo;

      if (organizationName) {
        setOrganization((prev: any) => ({
          ...(prev || {}),
          name: organizationName,
          slug: organizationSlug || prev?.slug,
          tier: organizationTier || prev?.tier,
          logo: organizationLogo || prev?.logo,
        }));
      }

      if (organizationId && fetchedOrganizationIdRef.current !== organizationId) {
        fetchedOrganizationIdRef.current = organizationId;
        fetchOrganization(organizationId);
      }
    }
  }, [user]);

  useEffect(() => {
    if (navItems.length === 0) return;

    const timer = window.setTimeout(() => {
      navItems.slice(0, 8).forEach((item) => {
        if (typeof item?.href === 'string') {
          router.prefetch(item.href);
        }
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [navItems, router]);

  const fetchOrganization = async (organizationId: string) => {
    setIsLoadingOrg(true);
    try {
      const orgData = await organizationService.getOrganizationById(organizationId);
      setOrganization(orgData);
    } catch (err) {
      console.error('Failed to fetch organization:', err);
      try {
        const stored = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (stored) {
          const parsedUser: any = JSON.parse(stored);
          const fallbackName = parsedUser.organizationName || parsedUser.organization?.name || parsedUser.companyName;
          if (fallbackName) {
            setOrganization((prev: any) => ({
              ...(prev || {}),
              name: fallbackName,
              slug: parsedUser.organization?.slug || prev?.slug,
              tier: parsedUser.organization?.tier || prev?.tier,
              logo: parsedUser.organization?.logo || prev?.logo,
            }));
          }
        }
      } catch (fallbackErr) {
        console.error('Failed to parse fallback organization data:', fallbackErr);
      }
    } finally {
      setIsLoadingOrg(false);
    }
  };

  const prefetchRoute = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  const handleNavigation = useCallback(() => {
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
      <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
        <div className="flex-shrink-0 h-16 px-4 border-b border-gray-200 bg-white flex items-center dark:bg-gray-900 dark:border-gray-800">
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
    <div className="h-full flex flex-col bg-white border-r border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      {/* Header with Organization Name */}
      <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
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
            <h1 className="text-lg font-bold text-gray-800 truncate flex items-center gap-2 dark:text-gray-100">
              {isLoadingOrg ? (
                <span className="text-gray-400 dark:text-gray-500">Loading...</span>
              ) : (
                organization?.name || 'VIN17x CRM'
              )}
              {organization?.tier && !isLoadingOrg && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTierBadgeColor(organization.tier)}`}>
                  {organization.tier}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 truncate dark:text-gray-400">
              {organization?.slug ? `${organization.slug}.vin17x.com` : 'v1.0.0'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800"
        >
          <Icons.X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Items - takes all available space */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <div className="mb-4 px-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">MAIN MENU</h3>
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
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  className={`
                    group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 border border-blue-200 shadow-sm dark:from-blue-950 dark:to-blue-900 dark:text-blue-300 dark:border-blue-800' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white dark:hover:border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <Icons.ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${
                    active ? 'translate-x-0 opacity-100 text-blue-500 dark:text-blue-300' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60 text-gray-400 dark:text-gray-500'
                  }`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Profile Section - Fixed at bottom */}
      {user && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
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
                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-white">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                  {getUserRoleDisplayName()}
                </p>
              </div>
              <Icons.ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
                showUserMenu ? 'rotate-180' : ''
              }`} />
            </button>

            {/* User Menu Dropdown - appears above the user section */}
            {showUserMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 dark:bg-gray-800 dark:border-gray-700">
                <Link
                  href="/my-profile"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  onMouseEnter={() => prefetchRoute('/my-profile')}
                  onFocus={() => prefetchRoute('/my-profile')}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Icons.User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>My Profile</span>
                </Link>
                
                <Link
                  href="/settings"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  onMouseEnter={() => prefetchRoute('/settings')}
                  onFocus={() => prefetchRoute('/settings')}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Icons.Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {isDarkMode ? (
                    <Icons.Sun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Icons.Moon className="w-4 h-4 text-indigo-500" />
                  )}
                  <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
                </button>

                <Link
                  href="/help"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  onMouseEnter={() => prefetchRoute('/help')}
                  onFocus={() => prefetchRoute('/help')}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Icons.HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Help & Support</span>
                </Link>

                <div className="border-t border-gray-100 my-1 dark:border-gray-700"></div>

                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <Icons.LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Online status indicator */}
            <div className="mt-2 flex items-center gap-2 px-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
