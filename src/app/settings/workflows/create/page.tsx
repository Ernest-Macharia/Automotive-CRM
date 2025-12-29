'use client';

import CreateWorkflow from '@/components/settings/workflows/CreateWorkflow';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsLayoutWrapper from '@/components/settings/SettingsLayoutWrapper';

export default function CreateWorkflowRoute() {
  return (
    <ProtectedRoute>
      <SettingsLayoutWrapper>
        <CreateWorkflow />
      </SettingsLayoutWrapper>
    </ProtectedRoute>
  );
}