import React from 'react';
import { groupPermissionsByCategory, getPermissionInfo } from '@/lib/permissions/mapping';
import PermissionBadge from './PermissionBadge';

interface PermissionsViewProps {
  permissions: string[];
  title?: string;
  showCategories?: boolean;
  maxVisible?: number;
  className?: string;
}

const PermissionsView: React.FC<PermissionsViewProps> = ({
  permissions,
  title = 'Permissions',
  showCategories = true,
  maxVisible = 6,
  className = ''
}) => {
  if (!permissions || permissions.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-gray-500 italic">No permissions assigned</p>
      </div>
    );
  }

  const groupedPermissions = showCategories ? groupPermissionsByCategory(permissions) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {title} ({permissions.length})
        </h3>
      </div>

      {showCategories && groupedPermissions ? (
        Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-1">
              {category} ({perms.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {perms.map(perm => (
                <PermissionBadge
                  key={perm.key}
                  permission={perm.key}
                  size="sm"
                  showIcon
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-wrap gap-2">
          {permissions.slice(0, maxVisible).map(permission => (
            <PermissionBadge
              key={permission}
              permission={permission}
              size="sm"
              showIcon
            />
          ))}
          {permissions.length > maxVisible && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{permissions.length - maxVisible} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionsView;