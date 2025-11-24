// src/app/opportunities/new/page.tsx
'use client';

import { useState } from 'react';
import { CreateOpportunityModal } from '@/components/opportunities/CreateOpportunityModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, TrendingUp, Award } from 'lucide-react';

export default function NewOpportunityPage() {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    window.history.back();
  };

  const handleSuccess = (id: string) => {
    setOpen(false);
    window.location.href = `/opportunities/${id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Deals
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create New Service Job</h1>
                  <p className="text-sm text-gray-500">Add a new automotive service opportunity</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Simple Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Simple Stats Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">Service Jobs</div>
                      <div className="text-sm font-semibold text-gray-900">0</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">Pipeline Value</div>
                      <div className="text-sm font-semibold text-gray-900">KES 0</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Award className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">Completion Rate</div>
                      <div className="text-sm font-semibold text-gray-900">0%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Stages */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Service Stages</h3>
                <div className="space-y-3">
                  {['New', 'In Progress', 'Quoted', 'Completed'].map((stage, index) => (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-purple-500' :
                          index === 2 ? 'bg-indigo-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="text-sm text-gray-700">{stage}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900">0</div>
                        <div className="text-xs text-gray-500">0%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white shadow-sm border border-gray-200">
              <CreateOpportunityModal
                open={open}
                onClose={handleClose}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}