import {
  UserPlus,
  Users,
  UserCog,
  UserMinus,
  Shield,
  FilePlus,
  ClipboardList,
  FileEdit,
  FileX,
  Truck,
  Warehouse,
  Target,
  Briefcase,
  PenLine,
  Trash2,
  FileText,
  File,
  CheckCircle,
  Receipt,
  CreditCard,
  LayoutDashboard,
  BarChart3,
  PieChart,
  ClipboardCheck,
  Settings,
  Eye,
  Edit,
  Calendar,
  Wrench,
  Ticket,
  Lock,
  MessageSquare,
  Handshake,
  Package,
  ClipboardPlus,
  ClipboardEdit,
  ClipboardX,
  User,
  Plus,
  Minus,
  type LucideIcon,
} from 'lucide-react';

export interface PermissionInfo {
  key: string;
  label: string;
  description: string;
  category: string;
  icon?: LucideIcon;
  color: string;
}

export const PERMISSION_CATEGORIES = {
  USERS: 'Users & Roles',
  JOBS: 'Jobs & Work Orders',
  VEHICLES: 'Vehicles & Fleet',
  OPPORTUNITIES: 'Sales & Opportunities',
  QUOTES: 'Quotes & Proposals',
  INVOICES: 'Invoices & Payments',
  JOB_CARDS: 'Job Cards & Tasks',
  WAIVERS: 'Waivers & Agreements',
  CONTACTS: 'Contacts & Clients',
  REPORTS: 'Reports & Analytics',
  DASHBOARD: 'Dashboard & Overview',
  SETTINGS: 'Settings & Configuration',
  PARTNERS: 'Partners & Dealers',
  CUSTOMER: 'Customer Portal',
  TEAM: 'Team Management',
  TARGETS: 'Targets & Goals',
  MAINTENANCE: 'Maintenance & Service',
  TICKETS: 'Support Tickets'
} as const;

export const PERMISSION_MAPPING: Record<string, PermissionInfo> = {
  'users.create': {
    key: 'users.create',
    label: 'Create Users',
    description: 'Create new user accounts',
    category: PERMISSION_CATEGORIES.USERS,
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-800'
  },
  'users.read': {
    key: 'users.read',
    label: 'View Users',
    description: 'View user accounts and details',
    category: PERMISSION_CATEGORIES.USERS,
    icon: Users,
    color: 'bg-blue-100 text-blue-800'
  },
  'users.update': {
    key: 'users.update',
    label: 'Edit Users',
    description: 'Update user information',
    category: PERMISSION_CATEGORIES.USERS,
    icon: UserCog,
    color: 'bg-blue-100 text-blue-800'
  },
  'users.delete': {
    key: 'users.delete',
    label: 'Delete Users',
    description: 'Remove user accounts',
    category: PERMISSION_CATEGORIES.USERS,
    icon: UserMinus,
    color: 'bg-red-100 text-red-800'
  },
  'roles.manage': {
    key: 'roles.manage',
    label: 'Manage Roles',
    description: 'Create and modify user roles',
    category: PERMISSION_CATEGORIES.USERS,
    icon: Shield,
    color: 'bg-purple-100 text-purple-800'
  },

  'jobs.create': {
    key: 'jobs.create',
    label: 'Create Jobs',
    description: 'Create new work orders',
    category: PERMISSION_CATEGORIES.JOBS,
    icon: FilePlus,
    color: 'bg-green-100 text-green-800'
  },
  'jobs.read': {
    key: 'jobs.read',
    label: 'View Jobs',
    description: 'View work orders',
    category: PERMISSION_CATEGORIES.JOBS,
    icon: ClipboardList,
    color: 'bg-green-100 text-green-800'
  },
  'jobs.update': {
    key: 'jobs.update',
    label: 'Update Jobs',
    description: 'Modify work orders',
    category: PERMISSION_CATEGORIES.JOBS,
    icon: FileEdit,
    color: 'bg-green-100 text-green-800'
  },
  'jobs.delete': {
    key: 'jobs.delete',
    label: 'Delete Jobs',
    description: 'Remove work orders',
    category: PERMISSION_CATEGORIES.JOBS,
    icon: FileX,
    color: 'bg-red-100 text-red-800'
  },

  'vehicles.create': {
    key: 'vehicles.create',
    label: 'Add Vehicles',
    description: 'Add new vehicles to fleet',
    category: PERMISSION_CATEGORIES.VEHICLES,
    icon: Plus,
    color: 'bg-orange-100 text-orange-800'
  },
  'vehicles.read': {
    key: 'vehicles.read',
    label: 'View Vehicles',
    description: 'View vehicle information',
    category: PERMISSION_CATEGORIES.VEHICLES,
    icon: Truck,
    color: 'bg-orange-100 text-orange-800'
  },
  'vehicles.update': {
    key: 'vehicles.update',
    label: 'Edit Vehicles',
    description: 'Update vehicle details',
    category: PERMISSION_CATEGORIES.VEHICLES,
    icon: Edit,
    color: 'bg-orange-100 text-orange-800'
  },
  'vehicles.delete': {
    key: 'vehicles.delete',
    label: 'Remove Vehicles',
    description: 'Delete vehicles from fleet',
    category: PERMISSION_CATEGORIES.VEHICLES,
    icon: Minus,
    color: 'bg-red-100 text-red-800'
  },
  'vehicles.manage': {
    key: 'vehicles.manage',
    label: 'Manage Fleet',
    description: 'Overall fleet management',
    category: PERMISSION_CATEGORIES.VEHICLES,
    icon: Warehouse,
    color: 'bg-orange-100 text-orange-800'
  },

  'opportunities.create': {
    key: 'opportunities.create',
    label: 'Create Leads',
    description: 'Create new sales opportunities',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: Target,
    color: 'bg-teal-100 text-teal-800'
  },
  'opportunities.read': {
    key: 'opportunities.read',
    label: 'View Leads',
    description: 'View sales opportunities',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: Briefcase,
    color: 'bg-teal-100 text-teal-800'
  },
  'opportunities.update': {
    key: 'opportunities.update',
    label: 'Update Leads',
    description: 'Modify sales opportunities',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: PenLine,
    color: 'bg-teal-100 text-teal-800'
  },
  'opportunities.delete': {
    key: 'opportunities.delete',
    label: 'Delete Leads',
    description: 'Remove sales opportunities',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: Trash2,
    color: 'bg-red-100 text-red-800'
  },

  'quotes.create': {
    key: 'quotes.create',
    label: 'Create Quotes',
    description: 'Create new price quotes',
    category: PERMISSION_CATEGORIES.QUOTES,
    icon: FileText,
    color: 'bg-cyan-100 text-cyan-800'
  },
  'quotes.read': {
    key: 'quotes.read',
    label: 'View Quotes',
    description: 'View price quotes',
    category: PERMISSION_CATEGORIES.QUOTES,
    icon: File,
    color: 'bg-cyan-100 text-cyan-800'
  },
  'quotes.update': {
    key: 'quotes.update',
    label: 'Update Quotes',
    description: 'Modify price quotes',
    category: PERMISSION_CATEGORIES.QUOTES,
    icon: FileEdit,
    color: 'bg-cyan-100 text-cyan-800'
  },
  'quotes.delete': {
    key: 'quotes.delete',
    label: 'Delete Quotes',
    description: 'Remove price quotes',
    category: PERMISSION_CATEGORIES.QUOTES,
    icon: FileX,
    color: 'bg-red-100 text-red-800'
  },
  'quotes.approve': {
    key: 'quotes.approve',
    label: 'Approve Quotes',
    description: 'Approve price quotes',
    category: PERMISSION_CATEGORIES.QUOTES,
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800'
  },

  'invoices.create': {
    key: 'invoices.create',
    label: 'Create Invoices',
    description: 'Create new invoices',
    category: PERMISSION_CATEGORIES.INVOICES,
    icon: Receipt,
    color: 'bg-indigo-100 text-indigo-800'
  },
  'invoices.read': {
    key: 'invoices.read',
    label: 'View Invoices',
    description: 'View invoices',
    category: PERMISSION_CATEGORIES.INVOICES,
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-800'
  },
  'invoices.update': {
    key: 'invoices.update',
    label: 'Update Invoices',
    description: 'Modify invoices',
    category: PERMISSION_CATEGORIES.INVOICES,
    icon: FileEdit,
    color: 'bg-indigo-100 text-indigo-800'
  },
  'invoices.delete': {
    key: 'invoices.delete',
    label: 'Delete Invoices',
    description: 'Remove invoices',
    category: PERMISSION_CATEGORIES.INVOICES,
    icon: Trash2,
    color: 'bg-red-100 text-red-800'
  },
  'invoices.approve': {
    key: 'invoices.approve',
    label: 'Approve Invoices',
    description: 'Approve invoices',
    category: PERMISSION_CATEGORIES.INVOICES,
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800'
  },
  'invoices.pay': {
    key: 'invoices.pay',
    label: 'Process Payments',
    description: 'Process invoice payments',
    category: PERMISSION_CATEGORIES.INVOICES,
    icon: CreditCard,
    color: 'bg-green-100 text-green-800'
  },

  'dashboard.view': {
    key: 'dashboard.view',
    label: 'View Dashboard',
    description: 'Access main dashboard',
    category: PERMISSION_CATEGORIES.DASHBOARD,
    icon: LayoutDashboard,
    color: 'bg-purple-100 text-purple-800'
  },
  'sales.dashboard.view': {
    key: 'sales.dashboard.view',
    label: 'Sales Dashboard',
    description: 'Access sales dashboard',
    category: PERMISSION_CATEGORIES.DASHBOARD,
    icon: BarChart3,
    color: 'bg-purple-100 text-purple-800'
  },
  'reports.generate': {
    key: 'reports.generate',
    label: 'Generate Reports',
    description: 'Create analytical reports',
    category: PERMISSION_CATEGORIES.REPORTS,
    icon: PieChart,
    color: 'bg-gray-100 text-gray-800'
  },
  'summary.view': {
    key: 'summary.view',
    label: 'View Summary',
    description: 'View summary reports',
    category: PERMISSION_CATEGORIES.REPORTS,
    icon: ClipboardCheck,
    color: 'bg-gray-100 text-gray-800'
  },

  'settings.manage': {
    key: 'settings.manage',
    label: 'Manage Settings',
    description: 'Configure system settings',
    category: PERMISSION_CATEGORIES.SETTINGS,
    icon: Settings,
    color: 'bg-gray-100 text-gray-800'
  },

  'team.manage': {
    key: 'team.manage',
    label: 'Manage Team',
    description: 'Manage team members',
    category: PERMISSION_CATEGORIES.TEAM,
    icon: Users,
    color: 'bg-blue-100 text-blue-800'
  },
  'targets.set': {
    key: 'targets.set',
    label: 'Set Targets',
    description: 'Set performance targets',
    category: PERMISSION_CATEGORIES.TARGETS,
    icon: Target,
    color: 'bg-red-100 text-red-800'
  },

  'leads.create': {
    key: 'leads.create',
    label: 'Create Leads',
    description: 'Create new sales leads',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: UserPlus,
    color: 'bg-teal-100 text-teal-800'
  },
  'leads.read': {
    key: 'leads.read',
    label: 'View Leads',
    description: 'View sales leads',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: Eye,
    color: 'bg-teal-100 text-teal-800'
  },
  'leads.update': {
    key: 'leads.update',
    label: 'Update Leads',
    description: 'Modify sales leads',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: Edit,
    color: 'bg-teal-100 text-teal-800'
  },
  'leads.delete': {
    key: 'leads.delete',
    label: 'Delete Leads',
    description: 'Remove sales leads',
    category: PERMISSION_CATEGORIES.OPPORTUNITIES,
    icon: Trash2,
    color: 'bg-red-100 text-red-800'
  },

  'clients.read': {
    key: 'clients.read',
    label: 'View Clients',
    description: 'View client information',
    category: PERMISSION_CATEGORIES.CONTACTS,
    icon: Users,
    color: 'bg-blue-100 text-blue-800'
  },
  'clients.update': {
    key: 'clients.update',
    label: 'Update Clients',
    description: 'Modify client information',
    category: PERMISSION_CATEGORIES.CONTACTS,
    icon: UserCog,
    color: 'bg-blue-100 text-blue-800'
  },

  'maintenance.schedule': {
    key: 'maintenance.schedule',
    label: 'Schedule Maintenance',
    description: 'Schedule vehicle maintenance',
    category: PERMISSION_CATEGORIES.MAINTENANCE,
    icon: Calendar,
    color: 'bg-yellow-100 text-yellow-800'
  },
  'maintenance.update': {
    key: 'maintenance.update',
    label: 'Update Maintenance',
    description: 'Update maintenance records',
    category: PERMISSION_CATEGORIES.MAINTENANCE,
    icon: Wrench,
    color: 'bg-yellow-100 text-yellow-800'
  },

  'tickets.create': {
    key: 'tickets.create',
    label: 'Create Tickets',
    description: 'Create support tickets',
    category: PERMISSION_CATEGORIES.TICKETS,
    icon: Ticket,
    color: 'bg-pink-100 text-pink-800'
  },
  'tickets.read': {
    key: 'tickets.read',
    label: 'View Tickets',
    description: 'View support tickets',
    category: PERMISSION_CATEGORIES.TICKETS,
    icon: Eye,
    color: 'bg-pink-100 text-pink-800'
  },
  'tickets.update': {
    key: 'tickets.update',
    label: 'Update Tickets',
    description: 'Modify support tickets',
    category: PERMISSION_CATEGORIES.TICKETS,
    icon: Edit,
    color: 'bg-pink-100 text-pink-800'
  },
  'tickets.close': {
    key: 'tickets.close',
    label: 'Close Tickets',
    description: 'Close support tickets',
    category: PERMISSION_CATEGORIES.TICKETS,
    icon: Lock,
    color: 'bg-gray-100 text-gray-800'
  },

  'customer.feedback': {
    key: 'customer.feedback',
    label: 'Customer Feedback',
    description: 'View customer feedback',
    category: PERMISSION_CATEGORIES.CUSTOMER,
    icon: MessageSquare,
    color: 'bg-green-100 text-green-800'
  },

  'partner.clients.read': {
    key: 'partner.clients.read',
    label: 'View Partner Clients',
    description: 'View partner client information',
    category: PERMISSION_CATEGORIES.PARTNERS,
    icon: Handshake,
    color: 'bg-indigo-100 text-indigo-800'
  },
  'partner.contracts.read': {
    key: 'partner.contracts.read',
    label: 'View Partner Contracts',
    description: 'View partner contracts',
    category: PERMISSION_CATEGORIES.PARTNERS,
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-800'
  },
  'partner.contracts.update': {
    key: 'partner.contracts.update',
    label: 'Update Partner Contracts',
    description: 'Modify partner contracts',
    category: PERMISSION_CATEGORIES.PARTNERS,
    icon: FileEdit,
    color: 'bg-indigo-100 text-indigo-800'
  },

  'customer.profile.read': {
    key: 'customer.profile.read',
    label: 'View Customer Profile',
    description: 'View customer profile',
    category: PERMISSION_CATEGORIES.CUSTOMER,
    icon: User,
    color: 'bg-blue-100 text-blue-800'
  },
  'customer.orders.view': {
    key: 'customer.orders.view',
    label: 'View Orders',
    description: 'View customer orders',
    category: PERMISSION_CATEGORIES.CUSTOMER,
    icon: Package,
    color: 'bg-green-100 text-green-800'
  },
  'customer.payments.read': {
    key: 'customer.payments.read',
    label: 'View Payments',
    description: 'View customer payments',
    category: PERMISSION_CATEGORIES.CUSTOMER,
    icon: CreditCard,
    color: 'bg-green-100 text-green-800'
  },

  'jobcards.create': {
    key: 'jobcards.create',
    label: 'Create Job Cards',
    description: 'Create job cards',
    category: PERMISSION_CATEGORIES.JOB_CARDS,
    icon: ClipboardPlus,
    color: 'bg-green-100 text-green-800'
  },
  'jobcards.read': {
    key: 'jobcards.read',
    label: 'View Job Cards',
    description: 'View job cards',
    category: PERMISSION_CATEGORIES.JOB_CARDS,
    icon: ClipboardList,
    color: 'bg-green-100 text-green-800'
  },
  'jobcards.update': {
    key: 'jobcards.update',
    label: 'Update Job Cards',
    description: 'Modify job cards',
    category: PERMISSION_CATEGORIES.JOB_CARDS,
    icon: ClipboardEdit,
    color: 'bg-green-100 text-green-800'
  },
  'jobcards.delete': {
    key: 'jobcards.delete',
    label: 'Delete Job Cards',
    description: 'Remove job cards',
    category: PERMISSION_CATEGORIES.JOB_CARDS,
    icon: ClipboardX,
    color: 'bg-red-100 text-red-800'
  },

  'waivers.create': {
    key: 'waivers.create',
    label: 'Create Waivers',
    description: 'Create legal waivers',
    category: PERMISSION_CATEGORIES.WAIVERS,
    icon: FilePlus,
    color: 'bg-orange-100 text-orange-800'
  },
  'waivers.read': {
    key: 'waivers.read',
    label: 'View Waivers',
    description: 'View waivers',
    category: PERMISSION_CATEGORIES.WAIVERS,
    icon: FileText,
    color: 'bg-orange-100 text-orange-800'
  },
  'waivers.update': {
    key: 'waivers.update',
    label: 'Update Waivers',
    description: 'Modify waivers',
    category: PERMISSION_CATEGORIES.WAIVERS,
    icon: FileEdit,
    color: 'bg-orange-100 text-orange-800'
  },
  'waivers.delete': {
    key: 'waivers.delete',
    label: 'Delete Waivers',
    description: 'Remove waivers',
    category: PERMISSION_CATEGORIES.WAIVERS,
    icon: FileX,
    color: 'bg-red-100 text-red-800'
  },
  'waivers.sign': {
    key: 'waivers.sign',
    label: 'Sign Waivers',
    description: 'Sign digital waivers',
    category: PERMISSION_CATEGORIES.WAIVERS,
    icon: PenLine,
    color: 'bg-green-100 text-green-800'
  },

  'contacts.create': {
    key: 'contacts.create',
    label: 'Create Contacts',
    description: 'Add new contacts',
    category: PERMISSION_CATEGORIES.CONTACTS,
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-800'
  },
  'contacts.read': {
    key: 'contacts.read',
    label: 'View Contacts',
    description: 'View contact information',
    category: PERMISSION_CATEGORIES.CONTACTS,
    icon: Eye,
    color: 'bg-blue-100 text-blue-800'
  },
  'contacts.update': {
    key: 'contacts.update',
    label: 'Update Contacts',
    description: 'Modify contact details',
    category: PERMISSION_CATEGORIES.CONTACTS,
    icon: Edit,
    color: 'bg-blue-100 text-blue-800'
  },
  'contacts.delete': {
    key: 'contacts.delete',
    label: 'Delete Contacts',
    description: 'Remove contacts',
    category: PERMISSION_CATEGORIES.CONTACTS,
    icon: Trash2,
    color: 'bg-red-100 text-red-800'
  }
};

export function getPermissionInfo(permissionKey: string): PermissionInfo {
  return PERMISSION_MAPPING[permissionKey] || {
    key: permissionKey,
    label: formatPermissionLabel(permissionKey),
    description: permissionKey,
    category: 'Other',
    color: 'bg-gray-100 text-gray-800'
  };
}

export function formatPermissionLabel(permissionKey: string): string {
  const mapping = PERMISSION_MAPPING[permissionKey];
  if (mapping) return mapping.label;
  
  return permissionKey
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function groupPermissionsByCategory(permissions: string[]) {
  const grouped: Record<string, PermissionInfo[]> = {};
  
  permissions.forEach(permissionKey => {
    const info = getPermissionInfo(permissionKey);
    if (!grouped[info.category]) {
      grouped[info.category] = [];
    }
    grouped[info.category].push(info);
  });
  
  return grouped;
}

export function getPermissionCategories() {
  return Object.values(PERMISSION_CATEGORIES);
}