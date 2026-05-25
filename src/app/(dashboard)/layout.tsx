import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        {/* pt-safe-header = h-14 header + env(safe-area-inset-top) for notch/Dynamic Island */}
        <div className="p-4 lg:p-8 pt-safe-header pb-safe-nav">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
