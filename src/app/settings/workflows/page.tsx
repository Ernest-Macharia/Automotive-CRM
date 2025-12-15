import WorkflowsManagement from '@/components/settings/WorkflowsManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workflows - Settings',
  description: 'Create and manage automation workflows',
};

export default function WorkflowsPage() {
  return <WorkflowsManagement />;
}