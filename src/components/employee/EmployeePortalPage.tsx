'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, CheckCircle2, ClipboardList, MessageSquare, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  employeeService,
  EmployeeDashboardSummary,
  EmployeeIncident,
  EmployeeIncidentAcknowledgeData,
  EmployeeKpi,
  EmployeeLeaveApplicationData,
  EmployeeLeaveRequest,
} from '@/services/employeeService';

type EmployeeTab = 'overview' | 'leaves' | 'kpis' | 'incidents';

const defaultLeaveForm: EmployeeLeaveApplicationData = {
  leaveType: 'annual',
  startDate: '',
  endDate: '',
  days: 1,
  reason: '',
  supportingDocumentUrl: '',
  isEmergencyLeave: false,
  emergencyContact: '',
  contactDuringLeave: '',
};

export default function EmployeePortalPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<EmployeeTab>('overview');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [dashboard, setDashboard] = useState<EmployeeDashboardSummary | null>(null);
  const [leaves, setLeaves] = useState<EmployeeLeaveRequest[]>([]);
  const [kpis, setKpis] = useState<EmployeeKpi[]>([]);
  const [incidents, setIncidents] = useState<EmployeeIncident[]>([]);

  const [leaveStatus, setLeaveStatus] = useState('');
  const [kpiStatus, setKpiStatus] = useState('');
  const [leaveForm, setLeaveForm] = useState<EmployeeLeaveApplicationData>(defaultLeaveForm);
  const [incidentDecision, setIncidentDecision] = useState<Record<string, EmployeeIncidentAcknowledgeData['decision']>>({});
  const [incidentReason, setIncidentReason] = useState<Record<string, string>>({});
  const [incidentResponse, setIncidentResponse] = useState<Record<string, string>>({});

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardData, leaveData, kpiData, incidentData] = await Promise.all([
        employeeService.getDashboardSummary(),
        employeeService.getMyLeaves(leaveStatus || undefined),
        employeeService.getMyKpis(kpiStatus || undefined),
        employeeService.getMyIncidents(),
      ]);
      setDashboard(dashboardData);
      setLeaves(leaveData);
      setKpis(kpiData);
      setIncidents(incidentData);
    } catch (error: unknown) {
      console.error('Error loading employee portal data:', error);
      showToast('Failed to load employee data', 'error');
    } finally {
      setLoading(false);
    }
  }, [kpiStatus, leaveStatus, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const leaveStats = useMemo(() => {
    return {
      total: leaves.length,
      approved: leaves.filter(item => item.status === 'approved').length,
      pending: leaves.filter(item => item.status === 'pending').length,
      denied: leaves.filter(item => item.status === 'denied').length,
    };
  }, [leaves]);

  const incidentStats = useMemo(() => {
    return {
      total: incidents.length,
      acknowledged: incidents.filter(item => item.acknowledged).length,
      pending: incidents.filter(item => !item.acknowledged).length,
    };
  }, [incidents]);

  const onApplyLeave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await employeeService.applyForLeave(leaveForm);
      showToast('Leave request submitted', 'success');
      setLeaveForm(defaultLeaveForm);
      await loadData();
    } catch (error: unknown) {
      console.error('Error applying for leave:', error);
      const message = getErrorMessage(error, 'Failed to submit leave request');
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onAcknowledgeIncident = async (incidentId: string) => {
    const decision = incidentDecision[incidentId] || 'accept';
    const reason = incidentReason[incidentId]?.trim();

    if (decision === 'reject' && !reason) {
      showToast('Reason is required when rejecting an incident', 'error');
      return;
    }

    try {
      await employeeService.acknowledgeIncident(incidentId, {
        decision,
        reason: reason || undefined,
      });
      showToast('Incident acknowledgement saved', 'success');
      await loadData();
    } catch (error: unknown) {
      console.error(`Error acknowledging incident ${incidentId}:`, error);
      const message = getErrorMessage(error, 'Failed to acknowledge incident');
      showToast(message, 'error');
    }
  };

  const onRespondIncident = async (incidentId: string) => {
    const message = incidentResponse[incidentId]?.trim();
    if (!message) {
      showToast('Please enter a response message', 'error');
      return;
    }

    try {
      await employeeService.respondToIncident(incidentId, { message });
      showToast('Incident response submitted', 'success');
      setIncidentResponse(prev => ({ ...prev, [incidentId]: '' }));
      await loadData();
    } catch (error: unknown) {
      console.error(`Error responding to incident ${incidentId}:`, error);
      showToast(getErrorMessage(error, 'Failed to submit response'), 'error');
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500">My Leave Requests</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{leaveStats.total}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500">Approved Leaves</p>
        <p className="text-2xl font-semibold text-green-700 mt-1">{leaveStats.approved}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500">KPI Reports</p>
        <p className="text-2xl font-semibold text-blue-700 mt-1">{kpis.length}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500">Pending Incidents</p>
        <p className="text-2xl font-semibold text-amber-700 mt-1">{incidentStats.pending}</p>
      </div>
      {dashboard && (
        <div className="md:col-span-2 xl:col-span-4 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Dashboard Snapshot</h3>
          <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 rounded-lg p-3">
            {JSON.stringify(dashboard, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  const renderLeaves = () => (
    <div className="space-y-5">
      <form onSubmit={onApplyLeave} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Apply for Leave</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={leaveForm.leaveType}
            onChange={e => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          >
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="unpaid">Unpaid</option>
            <option value="maternity">Maternity</option>
            <option value="paternity">Paternity</option>
            <option value="compassionate">Compassionate</option>
          </select>
          <input
            type="datetime-local"
            value={leaveForm.startDate}
            onChange={e => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
          <input
            type="datetime-local"
            value={leaveForm.endDate}
            onChange={e => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="number"
            min={1}
            value={leaveForm.days}
            onChange={e => setLeaveForm(prev => ({ ...prev, days: Number(e.target.value) }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Days"
            required
          />
          <input
            type="url"
            value={leaveForm.supportingDocumentUrl || ''}
            onChange={e => setLeaveForm(prev => ({ ...prev, supportingDocumentUrl: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Supporting document URL (optional)"
          />
        </div>
        <textarea
          value={leaveForm.reason}
          onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="Reason"
          rows={3}
          required
        />
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(leaveForm.isEmergencyLeave)}
              onChange={e => setLeaveForm(prev => ({ ...prev, isEmergencyLeave: e.target.checked }))}
              className="h-4 w-4"
            />
            Emergency leave
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">My Leave Requests</h3>
          <select
            value={leaveStatus}
            onChange={e => setLeaveStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="space-y-2">
          {leaves.length === 0 ? (
            <p className="text-sm text-gray-500">No leave requests found.</p>
          ) : (
            leaves.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{item.leaveType} leave</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{item.status}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(item.startDate).toLocaleString()} to {new Date(item.endDate).toLocaleString()} ({item.days} days)
                </p>
                <p className="text-xs text-gray-600 mt-1">{item.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderKpis = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">My KPI Reports</h3>
        <select
          value={kpiStatus}
          onChange={e => setKpiStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="space-y-2">
        {kpis.length === 0 ? (
          <p className="text-sm text-gray-500">No KPI reports found.</p>
        ) : (
          kpis.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title || 'KPI Report'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'No date'} {item.status ? `• ${item.status}` : ''}
                </p>
              </div>
              <div className="text-sm font-semibold text-blue-700">
                {typeof item.score === 'number' ? `${item.score}` : '-'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div className="space-y-3">
      {incidents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">No incidents found.</p>
        </div>
      ) : (
        incidents.map(item => {
          const id = item.id;
          const selectedDecision = incidentDecision[id] || 'accept';
          return (
            <div key={id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {item.status || 'unknown'} {item.severity ? `• ${item.severity}` : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${item.acknowledged ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.acknowledged ? 'Acknowledged' : 'Pending Ack'}
                </span>
              </div>

              {!item.acknowledged && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={selectedDecision}
                    onChange={e => setIncidentDecision(prev => ({ ...prev, [id]: e.target.value as EmployeeIncidentAcknowledgeData['decision'] }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="accept">Accept</option>
                    <option value="reject">Reject</option>
                  </select>
                  <input
                    type="text"
                    value={incidentReason[id] || ''}
                    onChange={e => setIncidentReason(prev => ({ ...prev, [id]: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2"
                    placeholder="Reason (required for reject)"
                  />
                  <button
                    onClick={() => onAcknowledgeIncident(id)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Acknowledge
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={incidentResponse[id] || ''}
                  onChange={e => setIncidentResponse(prev => ({ ...prev, [id]: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-3"
                  placeholder="Respond to this incident"
                />
                <button
                  onClick={() => onRespondIncident(id)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Response
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-slate-700 to-slate-900 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Employee Portal</h1>
            <p className="text-slate-200 text-xs">My dashboard, leaves, KPIs and incidents</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg hover:bg-white/20 transition-colors" title="Refresh">
          <RefreshCw className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            <ClipboardList className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm ${activeTab === 'leaves' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            <Calendar className="h-4 w-4" />
            Leaves
          </button>
          <button
            onClick={() => setActiveTab('kpis')}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm ${activeTab === 'kpis' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            <ShieldAlert className="h-4 w-4" />
            KPIs
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm ${activeTab === 'incidents' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            <MessageSquare className="h-4 w-4" />
            Incidents
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">Loading employee data...</div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'leaves' && renderLeaves()}
            {activeTab === 'kpis' && renderKpis()}
            {activeTab === 'incidents' && renderIncidents()}
          </>
        )}
      </div>
    </div>
  );
}
