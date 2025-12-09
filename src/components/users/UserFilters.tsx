import React, { useState } from 'react';
import { 
  Filter, 
  Users, 
  CheckCircle, 
  XCircle,
  Shield,
  Building,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface UserFiltersProps {
  roles: string[]; // This should be an array of role names (strings)
  roleFilter: string;
  statusFilter: string;
  disabled?: boolean;
  onRoleFilterChange: (role: string) => void;
  onStatusFilterChange: (status: string) => void;
  onAdvancedFilterChange?: (filters: any) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  roles,
  roleFilter,
  statusFilter,
  disabled,
  onRoleFilterChange,
  onStatusFilterChange,
  onAdvancedFilterChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    department: '',
    hasSummaryAccess: '',
    lastLogin: ''
  });

  const handleAdvancedFilterChange = (key: string, value: string) => {
    const newFilters = {
      ...advancedFilters,
      [key]: value
    };
    setAdvancedFilters(newFilters);
    onAdvancedFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    onRoleFilterChange('all');
    onStatusFilterChange('all');
    setAdvancedFilters({
      department: '',
      hasSummaryAccess: '',
      lastLogin: ''
    });
    onAdvancedFilterChange?.({
      department: '',
      hasSummaryAccess: '',
      lastLogin: ''
    });
  };

  const getRoleIcon = (roleName: string) => {
    const role = roleName.toLowerCase();
    if (role.includes('admin')) {
      return <Shield className="h-3 w-3" />;
    } else if (role.includes('manager') || role.includes('management') || role.includes('director')) {
      return <Users className="h-3 w-3" />;
    } else if (role.includes('technician') || role.includes('engineer') || role.includes('workshop')) {
      return <Building className="h-3 w-3" />;
    } else if (role.includes('sales') || role.includes('account')) {
      return <Users className="h-3 w-3" />;
    } else {
      return <Shield className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (roleName: string) => {
    if (!roleName || typeof roleName !== 'string') {
      return 'Unknown';
    }
    
    return roleName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get unique roles to avoid duplicate keys
  const uniqueRoles = Array.from(new Set(roles.filter(Boolean).map(String)));

  return (
    <div className="space-y-4">
      {/* Basic Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-gray-600">Status:</div>
          <div className="flex bg-gray-100/50 rounded-lg p-1">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => onStatusFilterChange('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                statusFilter === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-green-50'
              }`}
            >
              <CheckCircle className="h-3 w-3" />
              Active
            </button>
            <button
              onClick={() => onStatusFilterChange('inactive')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                statusFilter === 'inactive'
                  ? 'bg-red-100 text-red-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-red-50'
              }`}
            >
              <XCircle className="h-3 w-3" />
              Inactive
            </button>
          </div>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-gray-600">Role:</div>
          <div className="flex bg-gray-100/50 rounded-lg p-1 flex-wrap gap-1">
            <button
              onClick={() => onRoleFilterChange('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                roleFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              All Roles
            </button>
            {uniqueRoles.map((roleName) => {
              const roleString = String(roleName).trim();
              if (!roleString) return null;
              
              const getRoleColor = (role: string) => {
                const roleLower = role.toLowerCase();
                if (roleLower.includes('admin')) return 'bg-purple-100 text-purple-800';
                if (roleLower.includes('manager') || roleLower.includes('management') || roleLower.includes('director')) return 'bg-blue-100 text-blue-800';
                if (roleLower.includes('technician') || roleLower.includes('engineer') || roleLower.includes('workshop')) return 'bg-orange-100 text-orange-800';
                if (roleLower.includes('sales')) return 'bg-green-100 text-green-800';
                if (roleLower.includes('customer')) return 'bg-indigo-100 text-indigo-800';
                if (roleLower.includes('support')) return 'bg-teal-100 text-teal-800';
                return 'bg-gray-100 text-gray-800';
              };

              return (
                <button
                  key={roleString}
                  onClick={() => onRoleFilterChange(roleString)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1 capitalize ${
                    roleFilter === roleString
                      ? getRoleColor(roleString)
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {getRoleIcon(roleString)}
                  {getRoleLabel(roleString)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Filters Button */}
        {(roleFilter !== 'all' || statusFilter !== 'all' || Object.values(advancedFilters).some(v => v)) && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <div className="pt-2 border-t border-gray-200/50">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50/50 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Department Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    Department
                  </div>
                </label>
                <input
                  type="text"
                  value={advancedFilters.department}
                  onChange={(e) => handleAdvancedFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-300"
                  placeholder="e.g., Engineering"
                />
              </div>

              {/* Summary Access Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Summary Access
                  </div>
                </label>
                <select
                  value={advancedFilters.hasSummaryAccess}
                  onChange={(e) => handleAdvancedFilterChange('hasSummaryAccess', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-300"
                >
                  <option value="">All</option>
                  <option value="true">Has Access</option>
                  <option value="false">No Access</option>
                </select>
              </div>

              {/* Last Login Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Last Login
                  </div>
                </label>
                <select
                  value={advancedFilters.lastLogin}
                  onChange={(e) => handleAdvancedFilterChange('lastLogin', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-300"
                >
                  <option value="">Any time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="3months">Last 3 months</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            {/* Active Filter Indicators */}
            {Object.values(advancedFilters).some(v => v) && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs font-medium text-gray-600">Active filters:</span>
                <div className="flex flex-wrap gap-1">
                  {advancedFilters.department && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      <Building className="h-2 w-2" />
                      Dept: {advancedFilters.department}
                    </span>
                  )}
                  {advancedFilters.hasSummaryAccess && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                      <Shield className="h-2 w-2" />
                      {advancedFilters.hasSummaryAccess === 'true' ? 'Has Access' : 'No Access'}
                    </span>
                  )}
                  {advancedFilters.lastLogin && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      <Calendar className="h-2 w-2" />
                      Login: {advancedFilters.lastLogin}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilters;