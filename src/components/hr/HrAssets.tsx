'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Package, RefreshCw, RotateCcw, Save, Plus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  hrService,
  EmployeeAsset,
  AssignEmployeeAssetData,
  UpdateEmployeeAssetData,
  ReturnEmployeeAssetData,
} from '@/services/settings/hrService';
import { profileService, Profile } from '@/services/settings/profileService';

interface HrAssetsProps {
  searchTerm: string;
}

const emptyCreateForm: AssignEmployeeAssetData = {
  employeeUserId: '',
  employeeId: '',
  profileId: '',
  assetName: '',
  assetTag: '',
  assetType: '',
  serialNumber: '',
  assignedDate: '',
  expectedReturnDate: '',
  condition: '',
  notes: '',
};

export default function HrAssets({ searchTerm }: HrAssetsProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [createForm, setCreateForm] = useState<AssignEmployeeAssetData>(emptyCreateForm);
  const [selectedAsset, setSelectedAsset] = useState<EmployeeAsset | null>(null);
  const [editForm, setEditForm] = useState<UpdateEmployeeAssetData>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hrService.getAssets(statusFilter !== 'all' ? statusFilter : undefined);
      setAssets(data);
    } catch (error) {
      console.error('Error loading HR assets:', error);
      showToast('Failed to load HR assets', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, statusFilter]);

  const loadEmployeeAssets = async () => {
    if (!employeeFilter.trim()) {
      showToast('Select an employee to load assigned assets', 'info');
      return;
    }
    try {
      setLoading(true);
      const data = await hrService.getEmployeeAssets(employeeFilter.trim());
      setAssets(data);
    } catch (error) {
      console.error('Error loading employee assets:', error);
      showToast('Failed to load employee assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    profileService
      .getProfiles()
      .then(setProfiles)
      .catch((error) => {
        console.error('Error loading profiles for assets:', error);
      });
  }, []);

  const filteredAssets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(asset =>
      `${asset.assetName} ${asset.assetTag || ''} ${asset.assetType || ''} ${asset.employeeName || ''} ${asset.employeeId || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [assets, searchTerm]);

  const onCreateAsset = async (e: FormEvent) => {
    e.preventDefault();
    if (!createForm.assetName?.trim()) {
      showToast('Asset name is required', 'error');
      return;
    }
    if (!createForm.employeeUserId?.trim()) {
      showToast('Select an employee before assigning an asset', 'error');
      return;
    }

    try {
      setLoading(true);
      await hrService.assignAsset({
        ...createForm,
        employeeUserId: createForm.employeeUserId?.trim(),
        assetName: createForm.assetName.trim(),
      });
      showToast('Asset assigned successfully', 'success');
      setCreateForm(emptyCreateForm);
      setShowCreate(false);
      await loadAssets();
    } catch (error) {
      console.error('Error assigning asset:', error);
      showToast('Failed to assign asset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onQuickUpdateAsset = async (asset: EmployeeAsset) => {
    const assetId = asset._id || asset.id;
    if (!assetId) return;

    try {
      setUpdatingId(assetId);
      const updatePayload: UpdateEmployeeAssetData = {
        condition: asset.condition,
        notes: asset.notes,
        expectedReturnDate: asset.expectedReturnDate,
      };
      await hrService.updateAsset(assetId, updatePayload);
      showToast('Asset updated successfully', 'success');
      await loadAssets();
    } catch (error) {
      console.error('Error updating asset:', error);
      showToast('Failed to update asset', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (asset: EmployeeAsset) => {
    setSelectedAsset(asset);
    setEditForm({
      assetName: asset.assetName,
      assetType: asset.assetType,
      expectedReturnDate: asset.expectedReturnDate?.slice(0, 10),
      condition: asset.condition,
      notes: asset.notes,
      status: asset.status,
    });
    setShowEdit(true);
  };

  const onSaveAssetEdit = async (e: FormEvent) => {
    e.preventDefault();
    const assetId = selectedAsset?._id || selectedAsset?.id;
    if (!assetId) return;

    try {
      setUpdatingId(assetId);
      await hrService.updateAsset(assetId, editForm);
      showToast('Asset updated successfully', 'success');
      setShowEdit(false);
      setSelectedAsset(null);
      await loadAssets();
    } catch (error) {
      console.error('Error updating asset:', error);
      showToast('Failed to update asset', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const employeeOptions = useMemo(
    () =>
      profiles
        .filter((profile) => profile.active !== false)
        .map((profile) => ({
          value: typeof profile.user === 'object' ? (profile.user._id || profile.user.id || '') : '',
          label: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          employeeId: profile.employeeId || '',
          profileId: profile.id,
        }))
        .filter((option) => option.value && option.label),
    [profiles],
  );

  const onReturnAsset = async (asset: EmployeeAsset) => {
    const assetId = asset._id || asset.id;
    if (!assetId) return;
    try {
      setUpdatingId(assetId);
      const payload: ReturnEmployeeAssetData = {
        actualReturnDate: new Date().toISOString(),
        condition: asset.condition,
        notes: asset.notes,
      };
      await hrService.returnAsset(assetId, payload);
      showToast('Asset returned successfully', 'success');
      await loadAssets();
    } catch (error) {
      console.error('Error returning asset:', error);
      showToast('Failed to return asset', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={loadAssets}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="returned">Returned</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select
          value={employeeFilter}
          onChange={e => setEmployeeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All employees</option>
          {employeeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={loadEmployeeAssets}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          disabled={loading}
        >
          Load Employee Assets
        </button>
        <button
          onClick={() => setShowCreate(prev => !prev)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {showCreate ? 'Hide Assign Form' : 'Assign Asset'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={onCreateAsset} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Assign Company Asset</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={createForm.employeeUserId || ''}
              onChange={e => {
                const selected = employeeOptions.find(option => option.value === e.target.value);
                setCreateForm(prev => ({
                  ...prev,
                  employeeUserId: e.target.value,
                  employeeId: selected?.employeeId || '',
                  profileId: selected?.profileId || '',
                }));
              }}
            >
              <option value="">Select employee</option>
              {employeeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Asset Name"
              value={createForm.assetName || ''}
              onChange={e => setCreateForm(prev => ({ ...prev, assetName: e.target.value }))}
            />
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Asset Tag"
              value={createForm.assetTag || ''}
              onChange={e => setCreateForm(prev => ({ ...prev, assetTag: e.target.value }))}
            />
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Asset Type"
              value={createForm.assetType || ''}
              onChange={e => setCreateForm(prev => ({ ...prev, assetType: e.target.value }))}
            />
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Serial Number"
              value={createForm.serialNumber || ''}
              onChange={e => setCreateForm(prev => ({ ...prev, serialNumber: e.target.value }))}
            />
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={createForm.assignedDate?.slice(0, 10) || ''}
              onChange={e => setCreateForm(prev => ({ ...prev, assignedDate: e.target.value }))}
            />
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={createForm.expectedReturnDate?.slice(0, 10) || ''}
              onChange={e => setCreateForm(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
            />
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Condition"
              value={createForm.condition || ''}
              onChange={e => setCreateForm(prev => ({ ...prev, condition: e.target.value }))}
            />
          </div>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
            placeholder="Notes"
            value={createForm.notes || ''}
            onChange={e => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Assign Asset
          </button>
        </form>
      )}

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asset</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expected Return</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => {
              const id = asset._id || asset.id;
              const statusClass =
                asset.status === 'returned'
                  ? 'bg-gray-100 text-gray-700'
                  : asset.status === 'maintenance'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800';

              return (
                <tr key={id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{asset.assetName}</p>
                        <p className="text-xs text-gray-500">{asset.assetTag || asset.serialNumber || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {asset.employeeName || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {asset.assignedDate ? hrService.formatDate(asset.assignedDate) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {asset.expectedReturnDate ? hrService.formatDate(asset.expectedReturnDate) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(asset)}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onQuickUpdateAsset(asset)}
                        disabled={updatingId === id}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-60"
                      >
                        <Save className="h-3 w-3" />
                        Update
                      </button>
                      {asset.status !== 'returned' && (
                        <button
                          onClick={() => onReturnAsset(asset)}
                          disabled={updatingId === id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 disabled:opacity-60"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                  {loading ? 'Loading assets...' : 'No assets found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showEdit && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={onSaveAssetEdit} className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Asset</h3>
              <button type="button" onClick={() => setShowEdit(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={editForm.assetName || ''}
                onChange={e => setEditForm(prev => ({ ...prev, assetName: e.target.value }))}
                placeholder="Asset name"
              />
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={editForm.assetType || ''}
                onChange={e => setEditForm(prev => ({ ...prev, assetType: e.target.value }))}
                placeholder="Asset type"
              />
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={editForm.expectedReturnDate?.slice(0, 10) || ''}
                onChange={e => setEditForm(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
              />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={editForm.status || 'assigned'}
                onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="assigned">Assigned</option>
                <option value="returned">Returned</option>
                <option value="maintenance">Maintenance</option>
                <option value="lost">Lost</option>
                <option value="damaged">Damaged</option>
              </select>
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2"
                value={editForm.condition || ''}
                onChange={e => setEditForm(prev => ({ ...prev, condition: e.target.value }))}
                placeholder="Condition"
              />
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
              value={editForm.notes || ''}
              onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingId === (selectedAsset._id || selectedAsset.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
