import UserManagement from '@/components/settings/UserManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management - Settings',
  description: 'Manage system users, roles, and permissions',
};

export default function UsersPage() {
  return <UserManagement />;
}