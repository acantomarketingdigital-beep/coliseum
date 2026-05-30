// Auth pages are never statically prerendered — they depend on session state
export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
