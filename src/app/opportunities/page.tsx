// src/app/opportunities/page.tsx
'use client';

import { OpportunityKanbanBoard } from '@/components/opportunities/OpportunityKanbanBoard';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { CreateOpportunityModal } from '@/components/opportunities/CreateOpportunityModal';

export default function OpportunitiesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ───── Filter Panel (WHITE) ───── */}
      <aside className="filter-panel w-64 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Filter Opportunities by</h3>
        <input
          type="text"
          placeholder="Search..."
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        {/* System Filters */}
        <details open className="group mb-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">System Defined Filters</summary>
          <div className="mt-2 space-y-1.5 pl-2">
            {[
              'Touched Records',
              'Untouched Records',
              'Record Action',
              'Related Records Action',
              'Locked',
              'Latest Email Status',
              'Activities',
              'Cadences',
            ].map((l) => (
              <label key={l} className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300" />
                {l}
              </label>
            ))}
          </div>
        </details>
        {/* Field Filters */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">Filter By Fields</summary>
          <div className="mt-2 space-y-1.5 pl-2">
            {['Account Name', 'Amount', 'Campaign Source'].map((l) => (
              <label key={l} className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300" />
                {l}
              </label>
            ))}
          </div>
        </details>
      </aside>

      {/* ───── Main ───── */}
      <div className="flex-1 overflow-hidden">
        <header className="border-b bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button className="btn-primary">
                <Plus className="mr-2 h-4 w-4" /> Create Opportunity
              </Button>
              <Button variant="outline" size="sm">
                Actions <MoreVertical className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <select className="rounded border px-3 py-1 text-sm">
                <option>Sort By</option>
                <option>Amount</option>
                <option>Created Date</option>
              </select>
              <select className="rounded border px-3 py-1 text-sm">
                <option>Asc</option>
                <option>Desc</option>
              </select>
            </div>
          </div>
        </header>

        <main className="h-full overflow-auto p-6">
          <OpportunityKanbanBoard />
        </main>
      </div>

      <CreateOpportunityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(id) => (window.location.href = `/opportunities/${id}`)}
      />
    </div>
  );
}