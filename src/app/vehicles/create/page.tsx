import CreateVehicleForm from '@/components/vehicles/CreateVehicleForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add New Vehicle',
  description: 'Register a new vehicle in the system',
};

export default function CreateVehicleRoute() {
  return (
    <ProtectedRoute>
      <CreateVehicleForm />
    </ProtectedRoute>
  );
}