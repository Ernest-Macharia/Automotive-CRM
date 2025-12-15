import SettingsLayout from '@/components/settings/SettingsLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function SettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermissions={['settings.manage']}>
      <SettingsLayout>{children}</SettingsLayout>
    </ProtectedRoute>
  );
}