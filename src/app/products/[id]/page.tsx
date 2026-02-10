// app/products/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProductDetail from '@/components/products/ProductDetail';

export default function ProductDetailPage() {
  const params = useParams();
  
  return (
    <ProtectedRoute>
      <ProductDetail productId={params.id as string} />
    </ProtectedRoute>
  );
}