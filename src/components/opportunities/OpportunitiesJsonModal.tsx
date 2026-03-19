'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  opportunitiesJsonService,
  OpportunitiesJsonRecord,
} from '@/services/opportunitiesJsonService';
import { opportunityService } from '@/services/opportunityService';

interface OpportunitiesJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  canUpload: boolean;
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    duration?: number,
  ) => void;
}

function getRecordOrganizationId(record: OpportunitiesJsonRecord): string | null {
  const raw = record.raw || {};
  const candidates = [
    record.organizationId,
    raw.organizationId,
    raw.organization?._id,
    raw.organization,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
      continue;
    }
    if (typeof candidate === 'object') {
      if ('$oid' in candidate && candidate.$oid) {
        return String(candidate.$oid).trim();
      }
      if ('_id' in candidate && candidate._id) {
        if (typeof candidate._id === 'object' && candidate._id && '$oid' in candidate._id && candidate._id.$oid) {
          return String(candidate._id.$oid).trim();
        }
        return String(candidate._id).trim();
      }
      if ('id' in candidate && candidate.id) {
        return String(candidate.id).trim();
      }
    }
    return String(candidate).trim();
  }

  return null;
}

function getRecordOwnerName(record: OpportunitiesJsonRecord): string {
  return (
    record.owner?.name ||
    record.owner?.email ||
    record.raw?.owner?.name ||
    record.raw?.owner?.email ||
    'Unassigned'
  );
}

const PAGE_SIZE = 50;

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [loadingSalesReps, setLoadingSalesReps] = useState(false);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState('');
  const [reassignmentNote, setReassignmentNote] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const selectedRecords = useMemo(
    () => records.filter((record) => record._id && selectedRecordIds.includes(String(record._id))),
    [records, selectedRecordIds],
  );

  const selectedOrganizationIds = useMemo(
    () => Array.from(new Set(selectedRecords.map(getRecordOrganizationId).filter(Boolean))) as string[],
    [selectedRecords],
  );

  const selectedOrganizationId = selectedOrganizationIds.length === 1 ? selectedOrganizationIds[0] : null;
  const hasMixedOrganizations = selectedOrganizationIds.length > 1;
  const selectableRecords = useMemo(
    () => records.filter((record) => Boolean(record._id && record.originalId)),
    [records],
  );
  const allSelectableVisibleSelected =
    selectableRecords.length > 0 &&
    selectableRecords.every((record) => selectedRecordIds.includes(String(record._id)));

  const loadRecords = async (searchValue = '', nextPage = 1) => {
    try {
      setLoading(true);
      const result = await opportunitiesJsonService.search({
        ...(searchValue
          ? { q: searchValue, customerPhone: searchValue }
          : {}),
        page: nextPage,
        limit: PAGE_SIZE,
      });
      const nextRecords = result.data || [];
      const currentPage = result.meta?.currentPage || result.meta?.page || nextPage;
      setRecords(nextRecords);
      setTotal(result.meta?.total || 0);
      setPage(currentPage);
      setTotalPages(Math.max(result.meta?.totalPages || 1, 1));
      setSelectedRecordIds((prev) => {
        const validIds = new Set(nextRecords.map((record) => String(record._id || '')));
        return prev.filter((id) => validIds.has(id));
      });
    } catch (error) {
      console.error('Failed to load imported opportunities:', error);
      const message = error instanceof Error ? error.message : 'Failed to load imported opportunities data';
      showToast(message, 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void loadRecords(query, 1);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !canUpload) return;

    if (selectedRecordIds.length === 0) {
      setSalesReps([]);
      setSelectedSalesRepId('');
      return;
    }

    if (!selectedOrganizationId || hasMixedOrganizations) {
      setSalesReps([]);
      setSelectedSalesRepId('');
      return;
    }

    const loadSalesReps = async () => {
      try {
        setLoadingSalesReps(true);
        const reps = await opportunityService.getAvailableSalesReps(selectedOrganizationId);
        setSalesReps(reps || []);
      } catch (error) {
        console.error('Failed to load sales reps for imported opportunity reassignment:', error);
        setSalesReps([]);
        const message = error instanceof Error ? error.message : 'Failed to load sales reps for this organization';
        showToast(message, 'error', 4000);
      } finally {
        setLoadingSalesReps(false);
      }
    };

    void loadSalesReps();
  }, [isOpen, canUpload, selectedRecordIds, selectedOrganizationId, hasMixedOrganizations]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    await loadRecords(query.trim(), 1);
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
      await loadRecords(query.trim(), 1);
    } catch (error) {
      console.error('Failed to upload opportunities JSON:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload opportunities JSON file';
      showToast(message, 'error', 5000);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleToggleRecord = (recordId: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId],
    );
  };

  const handleToggleAllVisible = () => {
    if (allSelectableVisibleSelected) {
      setSelectedRecordIds((prev) =>
        prev.filter((id) => !selectableRecords.some((record) => String(record._id) === id)),
      );
      return;
    }

    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      selectableRecords.forEach((record) => {
        if (record._id) {
          next.add(String(record._id));
        }
      });
      return Array.from(next);
    });
  };

  const handleBulkReassign = async () => {
    if (selectedRecordIds.length === 0) {
      showToast('Select at least one imported opportunity to reassign', 'warning', 3500);
      return;
    }

    if (hasMixedOrganizations || !selectedOrganizationId) {
      showToast('Bulk reassignment only works for imported opportunities from the same organization', 'warning', 4500);
      return;
    }

    if (!selectedSalesRepId) {
      showToast('Select a sales representative first', 'warning', 3500);
      return;
    }

    try {
      setReassigning(true);
      const result = await opportunitiesJsonService.bulkReassign(
        selectedRecordIds,
        selectedSalesRepId,
        reassignmentNote,
      );

      if (result.failedCount > 0 && result.reassignedCount > 0) {
        showToast(
          `Reassigned ${result.reassignedCount} imported opportunity link(s). ${result.failedCount} failed.`,
          'warning',
          5000,
        );
      } else if (result.failedCount > 0) {
        showToast(
          result.failed?.[0]?.reason || 'Bulk reassignment failed',
          'error',
          5000,
        );
      } else {
        showToast(
          `Reassigned ${result.reassignedCount} imported opportunity link(s) successfully`,
          'success',
          4500,
        );
      }

      setSelectedRecordIds([]);
      setSelectedSalesRepId('');
      setReassignmentNote('');
      await loadRecords(query.trim(), 1);
    } catch (error) {
      console.error('Failed to bulk reassign imported opportunities:', error);
      const message = error instanceof Error ? error.message : 'Failed to bulk reassign imported opportunities';
      showToast(message, 'error', 5000);
    } finally {
      setReassigning(false);
    }
  };

  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 backdrop-blur-sm p-4">
      <div className="w-full max-w-7xl rounded-3xl bg-white shadow-2xl border border-white/40 overflow-hidden">
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

          {canUpload && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-violet-900">
                    <Users className="h-4 w-4" />
                    Bulk Reassignment
                  </div>
                  <p className="text-sm text-violet-700">
                    Select imported opportunities from one organization, then choose the sales representative who should own them.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      onClick={handleToggleAllVisible}
                      disabled={selectableRecords.length === 0}
                      className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 font-medium text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      {allSelectableVisibleSelected ? 'Clear Visible' : 'Select Visible'}
                    </button>
                    <span className="rounded-full bg-white px-3 py-1.5 text-violet-700 border border-violet-100">
                      {selectedRecordIds.length} selected
                    </span>
                    {hasMixedOrganizations && (
                      <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700 border border-amber-200">
                        Mixed organizations selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[minmax(240px,280px)_minmax(260px,320px)_auto]">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-violet-900">Sales Representative</label>
                    <select
                      value={selectedSalesRepId}
                      onChange={(e) => setSelectedSalesRepId(e.target.value)}
                      disabled={loadingSalesReps || selectedRecordIds.length === 0 || hasMixedOrganizations}
                      className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
                    >
                      <option value="">Select sales representative</option>
                      {salesReps.map((rep) => (
                        <option key={String(rep.id || rep._id || rep.userId)} value={String(rep.id || rep._id || rep.userId)}>
                          {rep.fullName || rep.name || rep.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-violet-900">Reassignment Note</label>
                    <input
                      value={reassignmentNote}
                      onChange={(e) => setReassignmentNote(e.target.value)}
                      placeholder="Optional note for this mass reassignment"
                      className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <button
                    onClick={() => void handleBulkReassign()}
                    disabled={
                      reassigning ||
                      loadingSalesReps ||
                      selectedRecordIds.length === 0 ||
                      !selectedSalesRepId ||
                      hasMixedOrganizations
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    {reassigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                    Mass Reassign
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100">
            <div className="grid grid-cols-[56px_1.3fr_1fr_1fr_1fr_0.9fr_0.8fr] gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-3 text-sm font-medium text-gray-700">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelectableVisibleSelected}
                  onChange={handleToggleAllVisible}
                  disabled={!canUpload || selectableRecords.length === 0}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
              </div>
              <div>Subject</div>
              <div>Customer</div>
              <div>Phone</div>
              <div>Owner</div>
              <div>Status</div>
              <div>Linked</div>
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
                records.map((record, index) => {
                  const recordId = String(record._id || '');
                  const isSelectable = Boolean(canUpload && record._id && record.originalId);
                  const isSelected = selectedRecordIds.includes(recordId);

                  return (
                    <div
                      key={`${record._id || record.subject || 'record'}-${index}`}
                      className="grid grid-cols-[56px_1.3fr_1fr_1fr_1fr_0.9fr_0.8fr] gap-4 border-b border-gray-100 px-5 py-3 text-sm text-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRecord(recordId)}
                          disabled={!isSelectable}
                          className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:opacity-40"
                        />
                      </div>
                      <div className="truncate font-medium text-gray-900">{record.subject || '-'}</div>
                      <div className="truncate">{record.customer?.name || record.customerName || '-'}</div>
                      <div className="truncate">{record.customer?.phone || record.phone || '-'}</div>
                      <div className="truncate">{getRecordOwnerName(record)}</div>
                      <div className="truncate">{record.status || record.currentStage || '-'}</div>
                      <div>
                        {record.originalId ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                            Linked
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                            Unlinked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing {pageStart}-{pageEnd} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadRecords(query.trim(), page - 1)}
                  disabled={loading || page <= 1}
                  className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="rounded-xl bg-gray-50 px-3 py-2 text-gray-700">
                  Page {page} of {Math.max(totalPages, 1)}
                </span>
                <button
                  onClick={() => void loadRecords(query.trim(), page + 1)}
                  disabled={loading || page >= totalPages}
                  className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
