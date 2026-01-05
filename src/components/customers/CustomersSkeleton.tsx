import React from 'react';

export default function CustomersSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <div className="h-8 w-8 bg-white/40 rounded" />
              </div>
              <div>
                <div className="h-7 w-32 bg-white/40 rounded mb-2" />
                <div className="h-4 w-48 bg-white/30 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 bg-white/30 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-8 w-24 bg-gray-300 rounded" />
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <div className="h-6 w-6 bg-gray-300 rounded" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-gray-200 rounded-lg" />
              <div className="h-9 w-24 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 w-32 bg-gray-300 rounded mb-2" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-300 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-300 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-300 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded" />
                    <div className="h-8 w-8 bg-gray-200 rounded" />
                    <div className="h-8 w-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-8 bg-gray-200 rounded-lg" />
                ))}
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}