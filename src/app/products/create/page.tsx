// app/products/create/page.tsx
'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProductCreate from '@/components/products/ProductCreate';

export default function CreateProductPage() {
  return (
    <ProtectedRoute>
      <ProductCreate />
    </ProtectedRoute>
  );
}