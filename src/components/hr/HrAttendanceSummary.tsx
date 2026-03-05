'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService } from '@/services/settings/hrService';

interface HrAttendanceSummaryProps {
  searchTerm: string;
}

export default function HrAttendanceSummary({ searchTerm }: HrAttendanceSummaryProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<any>(null);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hrService.getAttendanceSummary();
      setAttendance(data);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
      showToast('Failed to load attendance summary', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const rows = useMemo(() => {
    const source = Array.isArray(attendance)
      ? attendance
      : Array.isArray(attendance?.data)
        ? attendance.data
        : Array.isArray(attendance?.employees)
          ? attendance.employees
          : [];

    const q = searchTerm.trim().toLowerCase();
    if (!q) return source;
    return source.filter((row: any) =>
      `${row.name || ''} ${row.employeeId || ''} ${row.department || ''}`.toLowerCase().includes(q)
    );
  }, [attendance, searchTerm]);

  const summary = useMemo(() => {
    const source = attendance?.summary || {};
    const present = source.present ?? rows.filter((r: any) => r.status === 'present').length;
    const absent = source.absent ?? rows.filter((r: any) => r.status === 'absent').length;
    const late = source.late ?? rows.filter((r: any) => r.status === 'late').length;
    const total = source.total ?? rows.length;
    return { present, absent, late, total };
  }, [attendance, rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-sm">
            <div className="text-gray-500">Total</div>
            <div className="font-semibold text-gray-900">{summary.total}</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-sm">
            <div className="text-gray-500">Present</div>
            <div className="font-semibold text-gray-900">{summary.present}</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm">
            <div className="text-gray-500">Absent</div>
            <div className="font-semibold text-gray-900">{summary.absent}</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-sm">
            <div className="text-gray-500">Late</div>
            <div className="font-semibold text-gray-900">{summary.late}</div>
          </div>
        </div>
        <button
          onClick={loadAttendance}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check In</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check Out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, index: number) => {
              const status = (row.status || 'unknown').toLowerCase();
              const badgeClass =
                status === 'present'
                  ? 'bg-green-100 text-green-800'
                  : status === 'late'
                    ? 'bg-amber-100 text-amber-800'
                    : status === 'absent'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-700';
              return (
                <tr key={row.id || row._id || index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{row.name || row.employeeName || row.employeeId || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.department || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.checkIn || row.clockIn || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.checkOut || row.clockOut || '-'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                  {loading ? 'Loading attendance...' : 'No attendance data found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
