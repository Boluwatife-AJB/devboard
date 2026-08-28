import { AuthCookieSync } from "@/components/auth/auth-cookie-sync";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardMain } from "@/components/layout/dashboard-main";
import DashboardHeader from "@/components/layout/header";
import DashboardSidebar from "@/components/layout/sidebar";
import { NotificationSync } from "@/components/notifications/notification-sync";
import { PresenceSync } from "@/components/presence/presence-sync";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <AuthCookieSync />
        <PresenceSync />
        <NotificationSync />
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <DashboardMain>{children}</DashboardMain>
        </div>
      </div>
    </AuthGuard>
  );
}
