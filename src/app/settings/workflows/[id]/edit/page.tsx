'use client';

import { useParams } from 'next/navigation';
import EditWorkflow from '@/components/settings/workflows/EditWorkflow';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function EditWorkflowRoute() {
  const params = useParams();
  const workflowId = params.id as string;

  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <EditWorkflow workflowId={workflowId} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}