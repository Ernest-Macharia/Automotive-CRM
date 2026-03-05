'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, BadgeDollarSign } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { dealsService, Deal } from '@/services/dealsService';

export default function DealsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Deal[]>([]);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [items]
  );

  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dealsService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading deals:', error);
      showToast('Failed to load deals', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-1">{items.length} total deals</p>
        </div>
        <button
          onClick={loadDeals}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-700">
          <BadgeDollarSign className="h-4 w-4" />
          <span className="text-sm">Total Deal Value</span>
        </div>
        <p className="mt-1 text-xl font-semibold text-gray-900">{totalValue.toLocaleString()}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading deals...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No deals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item._id || item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.title || item.name || 'Untitled Deal'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.stage || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.status || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{Number(item.value || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
