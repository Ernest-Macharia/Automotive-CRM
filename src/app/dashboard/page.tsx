'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
// import DashboardContent from './DashboardContent';
import RoleBasedDashboard from '@/components/role/RoleBasedDashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <RoleBasedDashboard />
      {/* <DashboardContent /> */}
    </ProtectedRoute>
  );
}