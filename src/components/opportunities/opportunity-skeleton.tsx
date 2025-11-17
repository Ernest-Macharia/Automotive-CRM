// src/components/opportunities/opportunity-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function OpportunitySkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6">
          <div className="flex gap-8 py-3">
            {['Overview', 'Vehicles', 'Quotes', 'Invoices', 'Payments'].map((tab) => (
              <Skeleton key={tab} className="h-8 w-20" />
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 bg-gray-50 p-6">
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <Skeleton className="h-5 w-24 mb-4" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <Skeleton className="h-5 w-28 mb-4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}