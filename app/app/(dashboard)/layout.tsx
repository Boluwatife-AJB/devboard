import { AuthCookieSync } from "@/components/auth/auth-cookie-sync";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardMain } from "@/components/layout/dashboard-main";
import { DashboardRealtimeSync } from "@/components/layout/dashboard-realtime-sync";
import DashboardHeader from "@/components/layout/header";
import DashboardSidebar from "@/components/layout/sidebar";
import { OrgProvider } from "@/context/org-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <OrgProvider>
        <div className="flex h-screen bg-background">
          <AuthCookieSync />
          <DashboardRealtimeSync />
          <DashboardSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader />
            <DashboardMain>{children}</DashboardMain>
          </div>
        </div>
      </OrgProvider>
    </AuthGuard>
  );
}
