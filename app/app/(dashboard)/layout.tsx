import DashboardHeader from "@/components/layout/header";
import DashboardSidebar from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardHeader />
        <main className="min-w-0 flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
