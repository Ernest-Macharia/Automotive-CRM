import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EmployeePortalPage from '@/components/employee/EmployeePortalPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employee Portal',
  description: 'Employee dashboard and self-service tools',
};

export default function EmployeePageRoute() {
  return (
    <ProtectedRoute>
      <EmployeePortalPage />
    </ProtectedRoute>
  );
}
