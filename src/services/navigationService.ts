// services/navigationService.ts
import { authService } from './authService';

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  permission?: string;
  roles?: string[]; 
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/opportunities', label: 'Opportunities', icon: 'Target', permission: 'opportunities.read' },
  { href: '/customers', label: 'Customers', icon: 'Users', permission: 'clients.read' },
  { href: '/orders/sales-orders', label: 'Sales Orders', icon: 'ShoppingBag', permission: 'orders.read' },
  { href: '/orders/work-orders', label: 'Work Orders', icon: 'Wrench', permission: 'jobs.read' },
  { href: '/manychat', label: 'ManyChat', icon: 'MessageSquare', permission: 'manychat.access' },
  { href: '/contacts', label: 'Contacts', icon: 'Users', permission: 'contacts.read' },
  { href: '/kpi', label: 'KPI Reports', icon: 'Settings', permission: 'reports.generate' },
  { href: '/reports', label: 'Analytics', icon: 'BarChart3', permission: 'dashboard.view' },
  { href: '/quotes', label: 'Quotes', icon: 'FileText', permission: 'quotes.read' },
  { href: '/invoices', label: 'Invoices', icon: 'Receipt', permission: 'invoices.read' },
  { href: '/vehicles', label: 'Vehicles', icon: 'Truck', permission: 'vehicles.read' },
  { href: '/job-cards', label: 'Job Cards', icon: 'ClipboardList', permission: 'jobcards.read' },
  { href: '/settings', label: 'Settings', icon: 'Settings', permission: 'settings.manage' },
  { href: '/hr-portal', label: 'HR Portal', icon: 'Users', permission: 'hr.dashboard.view' },
];

export class NavigationService {
  static getNavItemsForUser(user: any): NavItem[] {
    if (!user) {
      return ALL_NAV_ITEMS.filter(item => item.href === '/dashboard');
    }
    
    const userRole = user.role?.name || user.role;
    const userPermissions = user.permissions || [];
    
    if (userRole === 'admin') {
      return ALL_NAV_ITEMS;
    }
    
    return ALL_NAV_ITEMS.filter(item => {
      if (item.href === '/dashboard') return true;
      
      if (item.permission) {
        return this.userHasPermission(user, item.permission);
      }
      
      return true;
    });
  }
 
  static userHasPermission(user: any, permission: string): boolean {
    if (!user || !user.permissions) return false;
    
    if (user.permissions.includes(permission)) {
      return true;
    }
    
    const parts = permission.split('.');
    if (parts.length >= 2) {
      const module = parts[0];
      const wildcardPermission = `${module}.*`;
      
      if (user.permissions.includes(wildcardPermission)) {
        return true;
      }
    }
    
    const userRole = user.role?.name || user.role;
    
    if (permission === 'reports.generate' || permission === 'dashboard.view') {
      return ['management', 'branch_manager', 'fleet_manager', 'finance'].includes(userRole);
    }
    
    if (permission.includes('sales') || permission.includes('leads') || permission.includes('opportunities')) {
      return userRole.includes('sales') || userRole === 'admin';
    }
    
    if (permission.includes('jobs') || permission.includes('vehicles') || permission.includes('technical')) {
      return userRole.includes('technician') || userRole.includes('engineer') || userRole === 'workshop';
    }
    
    return false;
  }

  static getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      LayoutDashboard: require('lucide-react').LayoutDashboard,
      Target: require('lucide-react').Target,
      Users: require('lucide-react').Users,
      ShoppingBag: require('lucide-react').ShoppingBag,
      Wrench: require('lucide-react').Wrench,
      FileText: require('lucide-react').FileText,
      Receipt: require('lucide-react').Receipt,
      Truck: require('lucide-react').Truck,
      ClipboardList: require('lucide-react').ClipboardList,
      Settings: require('lucide-react').Settings,
      BarChart3: require('lucide-react').BarChart3,
    };
    
    return iconMap[iconName] || require('lucide-react').LayoutDashboard;
  }
}