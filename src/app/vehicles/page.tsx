import VehiclesDashboard from '@/components/vehicles/VehiclesDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vehicle Registry',
  description: 'Manage your vehicle inventory and details',
};

export default function VehiclesPage() {
  return (
    <ProtectedRoute>
      <VehiclesDashboard />
    </ProtectedRoute>
  );
}