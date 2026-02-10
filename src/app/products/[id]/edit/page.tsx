// app/products/[id]/edit/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProductEdit from '@/components/products/ProductEdit';

export default function EditProductPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <ProductEdit productId={params.id as string} />
    </ProtectedRoute>
  );
}