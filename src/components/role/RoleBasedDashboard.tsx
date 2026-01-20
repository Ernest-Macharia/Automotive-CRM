// components/RoleBasedDashboard.tsx - CREATE THIS NEW FILE
'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import DashboardContent from '@/app/dashboard/DashboardContent'; // ← YOUR EXISTING DASHBOARD

// Minimal wrapper - just adds a role-specific header
const RoleBasedDashboard = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  if (!user) return <DashboardContent />; 

  const roleName = user.role?.display_name || user.role?.name || user.role;
  
  return (
    <div>
  
      <DashboardContent />
    </div>
  );
};

export default RoleBasedDashboard;