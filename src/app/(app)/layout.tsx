import AppLayout from '@/components/layout/app-layout';
import { CommandPalette } from '@/components/search/CommandPalette';
import { NotificationContainer } from '@/components/notifications/NotificationContainer';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      {children}
      <CommandPalette />
      <NotificationContainer />
    </AppLayout>
  );
}
