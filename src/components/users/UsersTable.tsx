import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  CheckCircle,
  XCircle,
  Key,
  Edit,
  Eye,
  Shield,
  User as UserIcon,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  FileText,
  Settings,
  Car,
  Target,
  Users as UsersIcon,
  BarChart,
  DollarSign,
  Clipboard,
  Handshake,
  MessageSquare,
  Ticket,
  Package,
  Trash2
} from 'lucide-react';
import { User, Role } from '@/services/userService';
import { getPermissionInfo, PERMISSION_CATEGORIES } from '@/lib/permissions/mapping';
import { useRouter } from 'next/navigation';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onToggleStatus: (id: string, active: boolean) => Promise<void>;
  onToggleSummaryAccess: (id: string, currentAccess: boolean) => Promise<void>;
  onEditUser: (user: User) => void;
  onViewDetails: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

// Helper function to extract role name from role (string or object)
const getRoleName = (role: string | Role): string => {
  if (!role) return 'Unknown';
  
  if (typeof role === 'string') {
    return role;
  }
  
  // If it's a Role object
  if (typeof role === 'object') {
    return role.name || role.display_name || role._id || 'Unknown';
  }
  
  return String(role);
};

// Helper function to format role name for display
const formatRoleName = (role: string | Role): string => {
  const roleName = getRoleName(role);
  return roleName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to get role color based on role name
const getRoleColor = (role: string | Role) => {
  const roleName = getRoleName(role).toLowerCase();
  
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    admin: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: 'text-purple-600'
    },
    management: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    technician: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      icon: 'text-orange-600'
    },
    sales_representative: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    branch_manager: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    fleet_manager: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    finance: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      icon: 'text-emerald-600'
    },
    compliance: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      icon: 'text-amber-600'
    },
    sales_director: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    sales_manager: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    sales_lead: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    account_executive: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    business_development: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    engineer: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      icon: 'text-orange-600'
    },
    workshop: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      icon: 'text-orange-600'
    },
    support: {
      bg: 'bg-teal-100',
      text: 'text-teal-800',
      icon: 'text-teal-600'
    },
    customer_service: {
      bg: 'bg-teal-100',
      text: 'text-teal-800',
      icon: 'text-teal-600'
    },
    dealer: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      icon: 'text-indigo-600'
    },
    partner: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      icon: 'text-indigo-600'
    },
    insurer: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      icon: 'text-indigo-600'
    },
    customer: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: 'text-gray-600'
    }
  };
  
  // Try exact match first
  if (colors[roleName]) {
    return colors[roleName];
  }
  
  // Try partial matches for flexibility
  if (roleName.includes('admin')) return colors.admin;
  if (roleName.includes('manager') || roleName.includes('management') || roleName.includes('director')) return colors.management;
  if (roleName.includes('technician') || roleName.includes('engineer') || roleName.includes('workshop')) return colors.technician;
  if (roleName.includes('sales')) return colors.sales_representative;
  if (roleName.includes('customer')) return colors.customer;
  if (roleName.includes('support')) return colors.support;
  if (roleName.includes('partner') || roleName.includes('dealer') || roleName.includes('insurer')) return colors.dealer;
  
  // Default color
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: 'text-gray-600'
  };
};

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  onToggleStatus,
  onToggleSummaryAccess,
  onEditUser,
  onViewDetails,
  onDeleteUser
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      return 'Invalid date';
    }
  };

  const handleAction = async (action: () => Promise<void>, userId: string) => {
    try {
      setActionLoading(userId);
      await action();
    } finally {
      setActionLoading(null);
    }
  };

  const router = useRouter();

  const handleViewDetails = (user: User) => {
    if (onViewDetails) {
        onViewDetails(user);
    } else {
        // If no handler provided, navigate directly
        router.push(`/clients/users/details?id=${user.id || user._id}`);
    }
    };

    const handleEditUser = (user: User) => {
    if (onEditUser) {
        onEditUser(user);
    } else {
        // If no handler provided, navigate directly
        router.push(`/clients/users/edit?id=${user.id || user._id}`);
    }
    };

  const handleDeleteUser = (user: User) => {
    if (onDeleteUser) {
        onDeleteUser(user);
    } else {
        console.warn('onDeleteUser handler is not provided');
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case PERMISSION_CATEGORIES.USERS:
        return <UsersIcon className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.JOBS:
        return <Clipboard className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.VEHICLES:
        return <Car className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.OPPORTUNITIES:
        return <Target className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.QUOTES:
        return <FileText className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.INVOICES:
        return <DollarSign className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.DASHBOARD:
      case PERMISSION_CATEGORIES.REPORTS:
        return <BarChart className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.SETTINGS:
        return <Settings className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.PARTNERS:
        return <Handshake className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.CUSTOMER:
        return <UserIcon className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.TICKETS:
        return <Ticket className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.JOB_CARDS:
        return <Clipboard className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.WAIVERS:
        return <FileText className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.CONTACTS:
        return <UsersIcon className="h-3 w-3" />;
      case PERMISSION_CATEGORIES.MAINTENANCE:
        return <Car className="h-3 w-3" />;
      default:
        return <Settings className="h-3 w-3" />;
    }
  };

  // Group permissions by category
  const groupPermissionsByCategory = (permissions: string[]) => {
    const grouped: Record<string, Array<{ key: string; label: string; description: string }>> = {};
    
    permissions.forEach(permissionKey => {
      const info = getPermissionInfo(permissionKey);
      if (!grouped[info.category]) {
        grouped[info.category] = [];
      }
      grouped[info.category].push({
        key: permissionKey,
        label: info.label,
        description: info.description
      });
    });
    
    return grouped;
  };

  // Render permission badge
  const renderPermissionBadge = (permissionKey: string) => {
    const info = getPermissionInfo(permissionKey);
    return (
      <span 
        key={permissionKey}
        className="px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all duration-200 hover:scale-105"
        style={{ 
          backgroundColor: info.color.split(' ')[0],
          color: info.color.split(' ')[1]
        }}
        title={info.description}
      >
        {info.icon ? (
          <info.icon className="w-3 h-3" />
        ) : (
          <span className="text-xs">🔧</span>
        )}
        <span>{info.label}</span>
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-gray-50/50">
            <tr>
              {['User', 'Contact', 'Role & Permissions', 'Status', 'Last Login', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-gray-200/30">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="ml-4">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="flex gap-1">
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                      <div className="h-5 bg-gray-200 rounded w-14"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!loading && users.length === 0) {
    return (
      <div className="text-center py-12">
        <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
        <p className="text-gray-600">Try adjusting your search or create a new user</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200/50">
        <thead className="bg-gray-50/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Role & Permissions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Last Login
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white/50 divide-y divide-gray-200/30">
          {users.map((user) => {
            const roleColor = getRoleColor(user.role);
            const isActionLoading = actionLoading === user.id;
            const roleName = formatRoleName(user.role);
            const isExpanded = expandedUser === user.id;
            const groupedPermissions = user.permissions ? groupPermissionsByCategory(user.permissions) : {};

            return (
              <React.Fragment key={user.id}>
                <tr 
                  className="hover:bg-white/70 transition-colors duration-200"
                  onMouseEnter={() => setSelectedUserId(user.id)}
                  onMouseLeave={() => setSelectedUserId(null)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 space-y-1">
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">{user.phone}</span>
                        </div>
                      )}
                      {user.department && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">{user.department}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ${roleColor.bg} ${roleColor.text}`}>
                          <Shield className={`h-3 w-3 ${roleColor.icon}`} />
                          {roleName}
                        </span>
                        {user.permissions && user.permissions.length > 0 && (
                          <button
                            onClick={() => toggleUserExpansion(user.id)}
                            className="ml-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Hide Permissions
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Show {user.permissions.length} Permissions
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {user.permissions && user.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {user.permissions.slice(0, 3).map(permission => 
                            renderPermissionBadge(permission)
                          )}
                          {user.permissions.length > 3 && !isExpanded && (
                            <button
                              onClick={() => toggleUserExpansion(user.id)}
                              className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full font-medium transition-colors"
                            >
                              +{user.permissions.length - 3} more
                            </button>
                          )}
                        </div>
                      )}
                      
                      {(!user.permissions || user.permissions.length === 0) && (
                        <span className="px-2.5 py-1 text-xs bg-gray-100 text-gray-500 rounded-full italic">
                          No permissions assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAction(
                          () => onToggleStatus(user.id, user.active),
                          user.id
                        )}
                        disabled={isActionLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm ${
                          user.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
                        } ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isActionLoading ? (
                          <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : user.active ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleAction(
                          () => onToggleSummaryAccess(user.id, user.canViewSummary || false),
                          user.id
                        )}
                        disabled={isActionLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm ${
                          user.canViewSummary
                            ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                        } ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isActionLoading ? (
                          <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Key className="h-3.5 w-3.5" />
                            {user.canViewSummary ? 'Summary Access' : 'No Summary Access'}
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium">{formatDate(user.lastLogin)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete User"
                        >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                      {/* <button
                        onClick={() => handleAction(
                          () => onToggleStatus(user.id, user.active),
                          user.id
                        )}
                        className={`p-1.5 rounded-lg transition-colors duration-200 ${
                          user.active 
                            ? 'hover:bg-red-50' 
                            : 'hover:bg-green-50'
                        }`}
                        title={user.active ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.active ? (
                          <Lock className="h-4 w-4 text-red-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-600" />
                        )}
                      </button> */}
                    </div>
                  </td>
                </tr>

                {/* Expanded Permissions Row */}
                {isExpanded && user.permissions && user.permissions.length > 0 && (
                  <tr className="bg-gray-50/80">
                    <td colSpan={6} className="px-6 py-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              All Permissions for {user.name}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {user.permissions.length} permissions across {Object.keys(groupedPermissions).length} categories
                            </p>
                          </div>
                          <button
                            onClick={() => toggleUserExpansion(user.id)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <ChevronUp className="h-4 w-4" />
                            Collapse
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(groupedPermissions).map(([category, permissions]) => (
                            <div 
                              key={category}
                              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                <div className="p-1.5 bg-gray-100 rounded-lg">
                                  {getCategoryIcon(category)}
                                </div>
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-900">{category}</h5>
                                  <p className="text-xs text-gray-500">{permissions.length} permissions</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {permissions.map(perm => {
                                    const info = getPermissionInfo(perm.key);
                                    return (
                                    <div 
                                        key={perm.key}
                                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                        title={perm.description}
                                    >
                                        {info.icon ? (
                                        <info.icon className="w-4 h-4 text-gray-500" />
                                        ) : (
                                        <span className="text-sm">🔧</span>
                                        )}
                                        <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {perm.label}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {perm.description}
                                        </div>
                                        </div>
                                    </div>
                                    );
                                })}
                                </div>
                            </div>
                          ))}
                        </div>
                        
                        {Object.keys(groupedPermissions).length === 0 && (
                          <div className="text-center py-6 bg-white rounded-xl border border-gray-200">
                            <p className="text-gray-500">No permissions found</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;