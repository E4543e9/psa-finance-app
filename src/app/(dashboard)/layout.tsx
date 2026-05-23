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
        {/* pt-14 = mobile top bar height, pb-20 = mobile bottom nav + safe area */}
        <div className="p-4 lg:p-8 pt-[72px] lg:pt-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
