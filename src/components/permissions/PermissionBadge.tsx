import React from 'react';
import { getPermissionInfo } from '@/lib/permissions/mapping';

interface PermissionBadgeProps {
  permission: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  permission,
  size = 'md',
  showIcon = true,
  showDescription = false,
  className = ''
}) => {
  const info = getPermissionInfo(permission);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const colorClasses = info.color || 'bg-gray-100 text-gray-800';

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
      title={showDescription ? info.description : undefined}
    >
      {showIcon && info.icon && (
        <info.icon className={`${iconSizes[size]} leading-none`} />
      )}
      {showIcon && !info.icon && (
        <span className="text-xs leading-none">🔧</span>
      )}
      <span>{info.label}</span>
    </div>
  );
};

export default PermissionBadge;