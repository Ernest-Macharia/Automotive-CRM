import { authService } from './authService';

export interface NavItem {
  href: string;
  label: string;
  icon?: any;
  permission?: string;
  roles?: string[];
  children?: NavItem[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/opportunities', label: 'Opportunities', icon: 'Target', permission: 'opportunities.read' },
  // { href: '/customers', label: 'Customers', icon: 'Users', permission: 'clients.read' },
  { href: '/orders/sales-orders', label: 'Sales Orders', icon: 'ShoppingBag', permission: 'orders.read' },
  {
    href: '/orders/work-orders',
    label: 'Work Orders',
    icon: 'Wrench',
    permission: 'jobs.read',
    children: [
      {
        href: '/pre-checklist',
        label: 'All Checklists',
        permission: 'jobs.read',
      },
      {
        href: '/pre-checklist/create?clientType=diamond-rims&source=sidebar',
        label: 'Create Checklist',
        permission: 'jobs.read',
      },
      {
        href: '/post-checklist',
        label: 'Post Checklists',
        permission: 'jobs.read',
      },
      {
        href: '/settings/webforms',
        label: 'Web Forms Builder',
      },
    ],
  },
  {
    href: '/manychat',
    label: 'ManyChat',
    icon: 'MessageSquare',
    permission: 'manychat.access',
    children: [
      {
        href: '/manychat/contacts',
        label: 'Contacts',
        permission: 'manychat.access',
      },
    ],
  },
  {
    href: '/settings/webforms',
    label: 'Web Forms',
    icon: 'FileText',
    permission: 'webforms.read',
  },
  { href: '/tickets', label: 'Tickets', icon: 'Ticket' },
  { href: '/employee', label: 'Employee Portal', icon: 'Briefcase' },
  { href: '/contacts', label: 'Contacts', icon: 'Users', permission: 'contacts.read' },
  { href: '/services', label: 'Services', icon: 'Settings', permission: 'services.read' },
  { href: '/products', label: 'Products', icon: 'Package', permission: 'products.read' },
  { href: '/pre-checklist', label: 'Checklists', icon: 'ClipboardCheck', permission: 'jobs.read' },
  { href: '/kpi', label: 'KPI Reports', icon: 'Settings', permission: 'reports.generate' },
  { href: '/reports', label: 'Analytics', icon: 'BarChart3', permission: 'dashboard.view' },
  { href: '/quotes', label: 'Quotes', icon: 'FileText', permission: 'quotes.read' },
  { href: '/invoices', label: 'Invoices', icon: 'Receipt', permission: 'invoices.read' },
  { href: '/vehicles', label: 'Vehicles', icon: 'Truck', permission: 'vehicles.read' },
  { href: '/job-cards', label: 'Job Cards', icon: 'ClipboardList', permission: 'jobcards.read' },
  { 
    href: '/feedback', 
    label: 'Feedback', 
    icon: 'MessageSquare', 
    permission: 'feedback.view',
    children: [
      { href: '/feedback', label: 'Manage Feedback', permission: 'feedback.manage' },
      { href: '/feedback/public', label: 'Public Feedback' },
      { href: '/feedback/my', label: 'My Feedback' },
      { href: '/feedback/assigned', label: 'Assigned to Me', permission: 'feedback.manage' },
      { href: '/feedback/stats', label: 'Analytics', permission: 'feedback.manage' },
      { href: '/feedback/roadmap', label: 'Roadmap' },
    ]
  },
  { href: '/settings', label: 'Settings', icon: 'Settings', permission: 'settings.manage' },
  // { href: '/my-profile', label: 'My Profile', icon: 'User', permission: 'profile.view' },
  { href: '/hr-portal', label: 'HR Portal', icon: 'Users', permission: 'hr.dashboard.view' },
];

export class NavigationService {
  static getNavItemsForUser(user: any): NavItem[] {
    if (!user) {
      return ALL_NAV_ITEMS.filter(item => item.href === '/dashboard');
    }
    
    const rawRole = user.roleName || user.role?.name || user.role || '';
    const normalizedRole = String(rawRole).toLowerCase().replace(/[\s_]+/g, '');
    
    if (normalizedRole === 'admin' || normalizedRole === 'superadmin' || normalizedRole === 'superadministrator') {
      return ALL_NAV_ITEMS;
    }
    
    return ALL_NAV_ITEMS.filter(item => {
      if (item.href === '/dashboard') return true;
      if (item.href === '/tickets' || item.href === '/contacts' || item.href === '/feedback') return true;
      if (item.href === '/manychat') {
        return this.userHasPermission(user, 'manychat.access');
      }
      if (item.href === '/settings/webforms') {
        return this.userHasPermission(user, 'webforms.read')
          || this.userHasPermission(user, 'webforms.manage')
          || this.userHasPermission(user, 'forms.read')
          || this.userHasPermission(user, 'forms.manage');
      }
      // if (item.href === '/my-profile') return true;
      
      if (item.permission) {
        return this.userHasPermission(user, item.permission);
      }
      
      return true;
    });
  }
 
  static userHasPermission(user: any, permission: string): boolean {
    const effectivePermissions = Array.from(
      new Set([
        ...(Array.isArray(user?.permissions) ? user.permissions : []),
        ...(Array.isArray(user?.allPermissions) ? user.allPermissions : []),
        ...(Array.isArray(user?.rolePermissions) ? user.rolePermissions : []),
        ...(Array.isArray(user?.additionalPermissions) ? user.additionalPermissions : []),
        ...(Array.isArray(user?.directPermissions) ? user.directPermissions : []),
      ]),
    );

    if (!user) return false;

    const rawRole = String(user.roleName || user.role?.name || user.role || '').toLowerCase();
    const normalizedRole = rawRole.replace(/[\s_]+/g, '');
    if (normalizedRole === 'admin' || normalizedRole === 'superadmin' || normalizedRole === 'superadministrator') {
      return true;
    }

    if (effectivePermissions.length === 0) return false;

    const normalizedPermission = String(permission || '').toLowerCase();
    const normalizedPermissions = new Set(
      effectivePermissions.map((entry) => String(entry || '').toLowerCase()),
    );

    const aliasMap: Record<string, string> = {
      'webforms.read': 'forms.read',
      'webforms.manage': 'forms.manage',
      'forms.read': 'webforms.read',
      'forms.manage': 'webforms.manage',
    };

    if (normalizedPermissions.has(normalizedPermission)) {
      return true;
    }

    const aliasPermission = aliasMap[normalizedPermission];
    if (aliasPermission && normalizedPermissions.has(aliasPermission)) {
      return true;
    }
    
    if (effectivePermissions.includes(permission)) {
      return true;
    }
    
    const parts = normalizedPermission.split('.');
    if (parts.length >= 2) {
      const module = parts[0];
      const wildcardPermission = `${module}.*`;
      
      if (normalizedPermissions.has(wildcardPermission)) {
        return true;
      }

      if (module === 'webforms' && normalizedPermissions.has('forms.*')) {
        return true;
      }

      if (module === 'forms' && normalizedPermissions.has('webforms.*')) {
        return true;
      }
    }
    
    const userRole = String(user.roleName || user.role?.name || user.role || '').toLowerCase();
    
    if (permission === 'reports.generate' || permission === 'dashboard.view') {
      return ['management', 'branch_manager', 'fleet_manager', 'finance'].includes(userRole);
    }

    if (permission.startsWith('quotes.') || permission.startsWith('invoices.')) {
      return ['admin', 'management', 'finance', 'finance_director', 'accountant', 'controller', 'cfo'].includes(userRole);
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
      Ticket: require('lucide-react').Ticket,
      Briefcase: require('lucide-react').Briefcase,
      Settings: require('lucide-react').Settings,
      BarChart3: require('lucide-react').BarChart3,
    };
    
    return iconMap[iconName] || require('lucide-react').LayoutDashboard;
  }
}
