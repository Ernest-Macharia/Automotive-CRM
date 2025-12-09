'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreateUserPage from '@/components/users/CreateUserPage';
import { userService } from '@/services/userService';

export default function CreateUserRoute() {
  const [availableRoles, setAvailableRoles] = useState<
    Array<{ value: string; label: string; description?: string }>
  >([]);

  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      const response = await userService.getAllUsers();
      const roles = Array.from(new Set(response.data.map(user => {
        const role = user.role;
        if (!role) return null;
        
        if (typeof role === 'string') {
          return role;
        }
        
        if (typeof role === 'object') {
          return role.name || role.display_name;
        }
        
        return String(role);
      }))).filter(Boolean) as string[];
      
      setAvailableRoles(roles.map(role => ({
        value: role,
        label: role.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      })));
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  return (
    <ProtectedRoute>
      <CreateUserPage 
        availableRoles={availableRoles}
      />
    </ProtectedRoute>
  );
}