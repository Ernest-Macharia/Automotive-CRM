'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrder } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';
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

interface WorkOrderDetailProps {
  orderId: string;
}

export default function WorkOrderDetail({ orderId }: WorkOrderDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(orderId);
      setWorkOrder(data);
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Failed to load work order details', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
  }, [orderId]);

  const handleRefresh = () => {
    fetchWorkOrder();
  };

  const handleStageTransition = async (stageAction: () => Promise<void>) => {
    try {
      setIsTransitioning(true);
      await stageAction();
      await fetchWorkOrder(); // Refresh data after transition
    } catch (error) {
      console.error('Stage transition error:', error);
      showToast('Action failed', 'error');
    } finally {
      setIsTransitioning(false);
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
      {/* Header */}
      <WorkOrderHeader 
        workOrder={workOrder}
        onRefresh={handleRefresh}
        onBack={() => router.push('/orders/work-orders')}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs Navigation */}
        <WorkOrderTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          workOrder={workOrder}
        />

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Stage Overview */}
              <StageOverview 
                workOrder={workOrder}
                isTransitioning={isTransitioning}
                onStageAction={handleStageTransition}
              />
              
              {/* Workflow Progress */}
              <WorkflowProgress workOrder={workOrder} />
              
              {/* Information Cards */}
              <InformationCards workOrder={workOrder} />
            </div>
          )}

          {activeTab === 'pre-checklist' && (
            <PreChecklistTab 
              workOrder={workOrder} 
              isTransitioning={isTransitioning}
              onAction={handleStageTransition}
            />
          )}

          {activeTab === 'job-cards' && (
            <JobCardsTab 
              workOrder={workOrder}
              isTransitioning={isTransitioning}
              onAction={handleStageTransition}
            />
          )}

          {activeTab === 'post-checklist' && (
            <PostChecklistTab 
              workOrder={workOrder}
              isTransitioning={isTransitioning}
              onAction={handleStageTransition}
            />
          )}

          {activeTab === 'invoice' && (
            <InvoiceTab 
              workOrder={workOrder}
              isTransitioning={isTransitioning}
              onAction={handleStageTransition}
            />
          )}

          {activeTab === 'technician-notes' && (
            <TechnicianNotesTab 
              workOrder={workOrder}
              isTransitioning={isTransitioning}
              onAction={handleStageTransition}
            />
          )}

          {activeTab === 'delays' && (
            <DelayTab 
              workOrder={workOrder}
              isTransitioning={isTransitioning}
              onAction={handleStageTransition}
            />
          )}
        </div>
      </div>
    </div>
  );
}