'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProductsList from '@/components/products/ProductsList';

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsList />
    </ProtectedRoute>
  );
}

