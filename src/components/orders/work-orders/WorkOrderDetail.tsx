'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrder } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import WorkOrderHeader from './WorkOrderHeader';
import WorkOrderTabs from './WorkOrderTabs';
import StageOverview from './StageOverview';
import WorkflowProgress from './WorkflowProgress';
import InformationCards from './InformationCards';
import PreChecklistTab from './tabs/PreChecklistTab';
import JobCardsTab from './tabs/JobCardsTab';
import PostChecklistTab from './tabs/PostChecklistTab';
import InvoiceTab from './tabs/InvoiceTab';
import TechnicianNotesTab from './tabs/TechnicianNotesTab';
import DelayTab from './tabs/DelayTab';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { workOrderService } from '@/services/workOrderService';
import { Menu, X, ChevronDown, MoreVertical, RefreshCw, ArrowLeft, Wrench, Printer, Edit, Bell } from 'lucide-react';

interface WorkOrderDetailProps {
  orderId: string;
}

// Mobile tab configuration
const mobileTabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'pre-checklist', label: 'Pre-Check', icon: '✅' },
  { id: 'job-cards', label: 'Job Cards', icon: '📋' },
  { id: 'post-checklist', label: 'Post-Check', icon: '📝' },
  { id: 'invoice', label: 'Invoice', icon: '💰' },
  { id: 'technician-notes', label: 'Notes', icon: '📌' },
  { id: 'delays', label: 'Delays', icon: '⚠️' }
];

export default function WorkOrderDetail({ orderId }: WorkOrderDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMobileTabs, setShowMobileTabs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWorkOrder = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      const data = await workOrderService.getWorkOrderById(orderId);
      setWorkOrder(data);
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Failed to load work order details', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
  }, [orderId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorkOrder(false);
    showToast('Work order refreshed', 'success');
  };

  const handleStageTransition = async (stageAction: () => Promise<void>) => {
    try {
      setIsTransitioning(true);
      await stageAction();
      await fetchWorkOrder(false);
      showToast('Stage updated successfully', 'success');
    } catch (error) {
      console.error('Stage transition error:', error);
      showToast('Action failed', 'error');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setShowMobileTabs(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTestStartNotification = async () => {
    try {
      const result = await workOrderService.testStartNotification(workOrder._id);
      showToast(result?.message || 'Test notification sent', 'success');
    } catch (error) {
      console.error('Error triggering test start notification:', error);
      showToast('Failed to trigger test start notification', 'error');
    } finally {
      setMobileMenuOpen(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!workOrder) {
    return <ErrorState onBack={() => router.push('/orders/work-orders')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Desktop Header - Hidden on mobile, shown on lg and up */}
      <div className="hidden lg:block">
        <WorkOrderHeader 
          workOrder={workOrder}
          onRefresh={handleRefresh}
          onBack={() => router.push('/orders/work-orders')}
        />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={() => router.push('/orders/work-orders')}
                className="p-2 -ml-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-white flex-shrink-0" />
                  <h1 className="text-base font-semibold text-white truncate">
                    {workOrder.workOrderNumber}
                  </h1>
                </div>
                {/* <p className="text-xs text-white/80 truncate mt-0.5">
                  {workOrder.vehicle?.make} {workOrder.vehicle?.model} • {workOrder.vehicle?.registration}
                </p> */}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-5 w-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <MoreVertical className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile Status Badge */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              workOrderService.getStatusColor(workOrder.status)
            }`}>
              {workOrderService.getStatusLabel(workOrder.status)}
            </span>
            <span className="text-xs text-white/80">
              Stage: {workOrder.currentStage || 'N/A'}
            </span>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="absolute right-4 top-20 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40"
          >
            <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
              Quick Actions
            </div>
            <button
              onClick={() => window.print()}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <Printer className="h-4 w-4 text-gray-600" />
              Print
            </button>
            <Link
              href={`/orders/work-orders/${workOrder._id}/edit`}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Edit className="h-4 w-4 text-gray-600" />
              Edit
            </Link>
            <button
              onClick={() => {
                // Add your custom action here
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="text-lg">📋</span>
              View Job Cards
            </button>
            <button
              onClick={() => {
                // Add your custom action here
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="text-lg">💰</span>
              Generate Invoice
            </button>
            <button
              onClick={handleTestStartNotification}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <Bell className="h-4 w-4 text-gray-600" />
              Test Start Notification
            </button>
          </div>
        )}
      </div>

      {/* Mobile Tabs Dropdown */}
      <div className="lg:hidden sticky top-[72px] z-20 bg-white border-b border-gray-200 px-4 py-2">
        <button
          onClick={() => setShowMobileTabs(!showMobileTabs)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{mobileTabs.find(t => t.id === activeTab)?.icon}</span>
            <span className="font-medium text-gray-900">
              {mobileTabs.find(t => t.id === activeTab)?.label || 'Overview'}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-600 transition-transform ${showMobileTabs ? 'rotate-180' : ''}`} />
        </button>

        {/* Mobile Tabs Menu */}
        {showMobileTabs && (
          <div className="absolute left-4 right-4 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-30 max-h-96 overflow-y-auto">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:block sticky top-0 z-20 bg-white border-b border-gray-200">
        <WorkOrderTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          workOrder={workOrder}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Tab Content */}
        <div className="space-y-4 lg:space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-4 lg:space-y-6">
              {/* Current Stage Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                    Current Stage
                  </h2>
                  <StageOverview 
                    workOrder={workOrder}
                    isTransitioning={isTransitioning}
                    onStageAction={handleStageTransition}
                  />
                </div>
              </div>
              
              {/* Workflow Progress */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 lg:p-6">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                    Workflow Progress
                  </h2>
                  <WorkflowProgress workOrder={workOrder} />
                </div>
              </div>
              
              {/* Information Cards */}
              <InformationCards workOrder={workOrder} />
            </div>
          )}

          {activeTab === 'pre-checklist' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-3 lg:mb-4">
                  <span className="text-xl">✅</span>
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                    Pre-Work Checklist
                  </h2>
                </div>
                <PreChecklistTab 
                  workOrder={workOrder} 
                  isTransitioning={isTransitioning}
                  onAction={handleStageTransition}
                />
              </div>
            </div>
          )}

          {activeTab === 'job-cards' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-3 lg:mb-4">
                  <span className="text-xl">📋</span>
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                    Job Cards
                  </h2>
                </div>
                <JobCardsTab 
                  workOrder={workOrder}
                  isTransitioning={isTransitioning}
                  onAction={handleStageTransition}
                />
              </div>
            </div>
          )}

          {activeTab === 'post-checklist' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-3 lg:mb-4">
                  <span className="text-xl">📝</span>
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                    Post-Work Checklist
                  </h2>
                </div>
                <PostChecklistTab 
                  workOrder={workOrder}
                  isTransitioning={isTransitioning}
                  onAction={handleStageTransition}
                />
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-3 lg:mb-4">
                  <span className="text-xl">💰</span>
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                    Invoice & Payment
                  </h2>
                </div>
                <InvoiceTab 
                  workOrder={workOrder}
                  isTransitioning={isTransitioning}
                  onAction={handleStageTransition}
                />
              </div>
            </div>
          )}

          {activeTab === 'technician-notes' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-3 lg:mb-4">
                  <span className="text-xl">📌</span>
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                    Technician Notes
                  </h2>
                </div>
                <TechnicianNotesTab 
                  workOrder={workOrder}
                  isTransitioning={isTransitioning}
                  onAction={handleStageTransition}
                />
              </div>
            </div>
          )}

          {activeTab === 'delays' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-3 lg:mb-4">
                  <span className="text-xl">⚠️</span>
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                    Delays & Issues
                  </h2>
                </div>
                <DelayTab 
                  workOrder={workOrder}
                  isTransitioning={isTransitioning}
                  onAction={handleStageTransition}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Padding (for better scrolling) */}
      <div className="lg:hidden h-16"></div>
    </div>
  );
}
