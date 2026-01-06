'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VehicleDetailPage from '@/components/vehicles/VehicleDetailPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function VehicleDetailRoute() {
  const params = useParams();
  const router = useRouter();
  
  const vehicleId = params?.id as string;

  useEffect(() => {
    
    // If ID is undefined, redirect to vehicles list
    if (!vehicleId || vehicleId === 'undefined') {
      console.error('Invalid vehicle ID detected, redirecting...');
      router.push('/vehicles');
    }
  }, [vehicleId, router, params]);

  if (!vehicleId || vehicleId === 'undefined') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading vehicle...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <VehicleDetailPage id={vehicleId} />
    </ProtectedRoute>
  );
}