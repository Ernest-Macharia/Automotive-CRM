import React from 'react';

export default function CustomerDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                <div className="h-5 w-5 bg-white/40 rounded" />
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <div className="h-8 w-8 bg-white/40 rounded" />
              </div>
              <div>
                <div className="h-8 w-48 bg-white/40 rounded mb-2" />
                <div className="h-4 w-32 bg-white/30 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <div className="h-5 w-5 bg-white/40 rounded" />
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <div className="h-5 w-5 bg-white/40 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 px-6">
                <div className="flex space-x-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 bg-gray-200 rounded" />
                        <div>
                          <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
                          <div className="h-5 w-32 bg-gray-300 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 bg-gray-200 rounded" />
                        <div>
                          <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
                          <div className="h-5 w-32 bg-gray-300 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Skeleton */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-lg p-4">
                        <div className="h-4 w-20 bg-gray-300 rounded mb-2" />
                        <div className="h-8 w-24 bg-gray-400 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Profile Card Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mb-4" />
                <div className="h-7 w-32 bg-gray-400 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-300 rounded" />
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 rounded" />
                    <div className="h-3 w-16 bg-gray-300 rounded" />
                  </div>
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="h-5 w-28 bg-gray-300 rounded mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>

            {/* Details Card Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-5 w-28 bg-gray-300 rounded mb-4" />
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                    <div className="h-5 w-32 bg-gray-300 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Card Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-5 w-28 bg-gray-300 rounded mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <div className="h-4 w-4 bg-gray-300 rounded" />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-300 rounded mb-1" />
                      <div className="h-3 w-40 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}