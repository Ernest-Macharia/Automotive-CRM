'use client';

import { useParams } from 'next/navigation';
import WorkflowDetails from '@/components/settings/workflows/WorkflowDetails';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function WorkflowDetailsRoute() {
  const params = useParams();
  const workflowId = params.id as string;

  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <WorkflowDetails workflowId={workflowId} />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}