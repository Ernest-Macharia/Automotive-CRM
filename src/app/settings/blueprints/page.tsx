// app/settings/blueprints/page.tsx
import BlueprintsManagement from '@/components/settings/BlueprintsManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blueprints - Settings',
  description: 'Design process templates and stages',
};

export default function BlueprintsPage() {
  return <BlueprintsManagement />;
}