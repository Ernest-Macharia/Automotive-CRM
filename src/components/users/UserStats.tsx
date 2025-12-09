import React from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Key,
  Building,
  Calendar,
  Activity
} from 'lucide-react';
import { User, Role } from '@/services/userService';

interface UserStatsProps {
  users: User[];
  stats?: any;
  loading?: boolean;
}

interface RoleStat {
  role: string;
  count: number;
  percentage: number;
}

interface StatsData {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
  withSummaryAccess: number;
  recentLogins: number;
  lastUpdated: string;
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

const UserStats: React.FC<UserStatsProps> = ({ users, stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const calculateStats = (): StatsData => {
    if (stats) return stats as StatsData;

    const activeUsers = users.filter(u => u.active).length;
    const inactiveUsers = users.filter(u => !u.active).length;
    
    // Group by role
    const byRole: Record<string, number> = {};
    users.forEach(user => {
      const roleName = getRoleName(user.role);
      byRole[roleName] = (byRole[roleName] || 0) + 1;
    });

    // Group by department
    const byDepartment: Record<string, number> = {};
    users.forEach(user => {
      const dept = user.department || 'Unassigned';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    // Users with summary access
    const withSummaryAccess = users.filter(u => u.canViewSummary).length;

    // Recently active (last 7 days)
    const recentLogins = users.filter(u => {
      if (!u.lastLogin) return false;
      try {
        const lastLogin = new Date(u.lastLogin);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return lastLogin > sevenDaysAgo;
      } catch {
        return false;
      }
    }).length;

    return {
      total: users.length,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole,
      byDepartment,
      withSummaryAccess,
      recentLogins,
      lastUpdated: new Date().toISOString()
    };
  };

  const currentStats = calculateStats();

  const statCards = [
    {
      title: 'Total Users',
      value: currentStats.total,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      change: '+12%',
      trend: 'up' as const
    },
    {
      title: 'Active Users',
      value: currentStats.active,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      change: '+5%',
      trend: 'up' as const
    },
    {
      title: 'With Summary Access',
      value: currentStats.withSummaryAccess,
      icon: Key,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      change: '+3%',
      trend: 'up' as const
    },
    {
      title: 'Recent Activity',
      value: currentStats.recentLogins,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      change: '+8%',
      trend: 'up' as const
    }
  ];

  // Role distribution
  const topRoles: RoleStat[] = Object.entries(currentStats.byRole)
    .sort((a, b) => {
      const countA = a[1];
      const countB = b[1];
      return countB - countA;
    })
    .slice(0, 3)
    .map(([role, count]) => ({
      role: role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      count,
      percentage: Math.round((count / currentStats.total) * 100)
    }));

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div 
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-xs ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role Distribution */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Distribution
          </h3>
          <div className="space-y-3">
            {topRoles.map((roleStat, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    <span className="text-sm text-gray-700">{roleStat.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{roleStat.count}</span>
                    <span className="text-xs text-gray-500">({roleStat.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${roleStat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {Object.keys(currentStats.byRole).length > 3 && (
              <div className="pt-2 text-center">
                <span className="text-xs text-gray-500">
                  +{Object.keys(currentStats.byRole).length - 3} more roles
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Quick Stats
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Departments</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Object.keys(currentStats.byDepartment).length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Inactive Users</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {currentStats.inactive}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">No Department</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {currentStats.byDepartment['Unassigned'] || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Active Rate</span>
              </div>
              <span className="text-sm font-medium text-green-600">
                {currentStats.total > 0 
                  ? Math.round((currentStats.active / currentStats.total) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;