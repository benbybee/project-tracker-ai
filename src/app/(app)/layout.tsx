import AppLayout from "@/components/layout/app-layout";
import { CommandPalette } from "@/components/search/CommandPalette";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
      <CommandPalette />
    </AppLayout>
  );
}
