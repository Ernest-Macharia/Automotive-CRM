'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, Upload, X, Database, RefreshCw } from 'lucide-react';
import {
  opportunitiesJsonService,
  OpportunitiesJsonRecord,
} from '@/services/opportunitiesJsonService';

interface OpportunitiesJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  canUpload: boolean;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

export default function OpportunitiesJsonModal({
  isOpen,
  onClose,
  canUpload,
  showToast,
}: OpportunitiesJsonModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<OpportunitiesJsonRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const loadRecords = async (searchValue = '') => {
    try {
      setLoading(true);
      const result = await opportunitiesJsonService.search(
        searchValue
          ? { q: searchValue, customerPhone: searchValue }
          : undefined,
      );
      setRecords(result.data || []);
      setTotal(result.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to load imported opportunities:', error);
      showToast(error.message || 'Failed to load imported opportunities data', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadRecords(query);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    await loadRecords(query.trim());
  };

  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await opportunitiesJsonService.uploadJsonFile(file, replaceExisting);
      showToast(
        `Imported ${result.imported} record(s) into shared opportunities JSON data`,
        'success',
        4000,
      );
      await loadRecords(query.trim());
    } catch (error: any) {
      console.error('Failed to upload opportunities JSON:', error);
      showToast(error.message || 'Failed to upload opportunities JSON file', 'error', 5000);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl border border-white/40 overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3">
                <Database className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Imported Opportunities Data</h2>
                <p className="text-sm text-gray-500">
                  Shared searchable dataset for both organizations
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">Total records: {total}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleSearch();
                    }
                  }}
                  placeholder="Search by customer, phone, source, email, subject..."
                  className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <button
                onClick={() => void handleSearch()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Search
              </button>
            </div>

            {canUpload && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  Replace existing dataset
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleUploadChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-medium text-white transition hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload JSON
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100">
            <div className="grid grid-cols-5 gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-3 text-sm font-medium text-gray-700">
              <div>Subject</div>
              <div>Customer</div>
              <div>Phone</div>
              <div>Email</div>
              <div>Status</div>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading data...
                </div>
              ) : records.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  No imported opportunities found.
                </div>
              ) : (
                records.map((record, index) => (
                  <div
                    key={`${record._id || record.subject || 'record'}-${index}`}
                    className="grid grid-cols-5 gap-4 border-b border-gray-100 px-5 py-3 text-sm text-gray-700 last:border-b-0"
                  >
                    <div className="truncate font-medium text-gray-900">{record.subject || '-'}</div>
                    <div className="truncate">{record.customer?.name || record.customerName || '-'}</div>
                    <div className="truncate">{record.customer?.phone || record.phone || '-'}</div>
                    <div className="truncate">{record.customer?.email || record.email || '-'}</div>
                    <div className="truncate">{record.status || record.currentStage || '-'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
