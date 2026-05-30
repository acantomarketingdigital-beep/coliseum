"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PinInput } from "@/components/ui/PinInput";
import { Button } from "@/components/ui/Button";

type Tab = "admin" | "referee";

export default function LoginPage() {
  const router = useRouter();

  const [tab, setTab]             = useState<Tab>("admin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [pinReset, setPinReset]   = useState(0);
  const [pinError, setPinError]   = useState(false);

  // ── Login do Administrador (email + senha) ──────────────────────────────────
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  // ── Login do Árbitro (email + PIN como senha) ───────────────────────────────
  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (!email) {
        setError("Informe seu e-mail antes de digitar o PIN.");
        setPinReset((n) => n + 1);
        return;
      }
      setError(null);
      setLoading(true);
      setPinError(false);

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pin,
      });

      if (authError) {
        setPinError(true);
        setError("PIN incorreto. Tente novamente.");
        setLoading(false);
        // Reset automático do PinInput via shake (veja PinInput.tsx)
        setTimeout(() => {
          setPinError(false);
          setPinReset((n) => n + 1);
        }, 700);
        return;
      }

      router.push("/dashboard");
    },
    [email, router]
  );

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center mb-4">
          <Trophy className="w-7 h-7 text-black" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Coli<span className="text-yellow-400">seum</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Gestão de campeonatos esportivos</p>
      </div>

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

        {/* Tabs */}
        <div className="flex bg-zinc-800 rounded-xl p-1 mb-6 gap-1">
          {(["admin", "referee"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setPinReset((n) => n + 1); }}
              className={`
                flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                ${tab === t
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-400 hover:text-white"
                }
              `}
            >
              {t === "admin" ? "Administrador" : "Árbitro"}
            </button>
          ))}
        </div>

        {/* Erro global */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* ── FORM ADMIN ─────────────────────────────────────────────────────── */}
        {tab === "admin" && (
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@suaquadra.com.br"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 h-12
                  text-white placeholder-zinc-600 text-sm
                  focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400
                  transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 pr-12 h-12
                    text-white placeholder-zinc-600 text-sm
                    focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400
                    transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              fullWidth
              disabled={loading}
              className="mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        )}

        {/* ── FORM ÁRBITRO (email + PIN) ─────────────────────────────────────── */}
        {tab === "referee" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arbitro@email.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 h-12
                  text-white placeholder-zinc-600 text-sm
                  focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400
                  transition-colors"
              />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider text-center">
                PIN de acesso rápido
              </p>
              <PinInput
                onComplete={handlePinComplete}
                error={pinError}
                disabled={loading}
                resetTrigger={pinReset}
              />
              <p className="text-zinc-600 text-xs text-center">
                Digite os 4 dígitos para entrar automaticamente
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando PIN...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-zinc-600 text-xs mt-6">
        Coliseum © {new Date().getFullYear()} — Acesso restrito
      </p>
    </div>
  );
}
