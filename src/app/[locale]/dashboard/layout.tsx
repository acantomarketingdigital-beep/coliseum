import { Header } from "@/components/layout/Header";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

// Dashboard pages depend on auth session — never prerender at build time
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <OfflineBanner />
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
