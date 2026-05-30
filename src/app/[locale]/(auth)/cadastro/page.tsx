"use client";

import { Fragment, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, ChevronRight, ChevronLeft,
  Eye, EyeOff, Check, CheckCircle2, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PinInput } from "@/components/ui/PinInput";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | "done";

const STEPS = [
  { num: 1, label: "Credenciais" },
  { num: 2, label: "Sua Arena"  },
  { num: 3, label: "Árbitro"   },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-400 text-xs mt-1 pl-1">{msg}</p>;
}

function inputCls(hasError?: boolean) {
  return [
    "w-full bg-zinc-800 border rounded-xl px-4 h-12 text-white",
    "placeholder-zinc-600 text-sm transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    hasError
      ? "border-red-500 focus:ring-red-500"
      : "border-zinc-700 focus:ring-yellow-400 focus:border-yellow-400",
  ].join(" ");
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
      {children}
    </label>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CadastroPage() {
  const router = useRouter();

  const [step, setStep]             = useState<WizardStep>(1);
  const [loading, setLoading]       = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [errs, setErrs]             = useState<Record<string, string>>({});

  // Step 1 — credenciais
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass]     = useState(false);

  // Step 2 — arena
  const [arenaName, setArenaName]   = useState("");
  const [arenaId, setArenaId]       = useState<string | null>(null);

  // Step 3 — árbitro
  const [refName, setRefName]       = useState("");
  const [refEmail, setRefEmail]     = useState("");
  const [refPin, setRefPin]         = useState("");
  const [pinError, setPinError]     = useState(false);
  const [pinReset, setPinReset]     = useState(0);

  // ── Validações ──────────────────────────────────────────────────────────────

  function validateStep1() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2)       e.name = "Nome deve ter ao menos 2 caracteres.";
    if (!isValidEmail(email))          e.email = "E-mail inválido.";
    if (password.length < 8)           e.password = "Senha deve ter ao menos 8 caracteres.";
    if (password !== confirmPass)      e.confirmPass = "As senhas não coincidem.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (arenaName.trim().length < 3)  e.arenaName = "Nome deve ter ao menos 3 caracteres.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e: Record<string, string> = {};
    if (refName.trim().length < 2)    e.refName = "Nome deve ter ao menos 2 caracteres.";
    if (!isValidEmail(refEmail))       e.refEmail = "E-mail inválido.";
    if (refPin.length !== 4)           e.refPin = "PIN deve ter exatamente 4 dígitos.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function goToStep(s: WizardStep) {
    setGlobalError(null);
    setErrs({});
    setStep(s);
  }

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (validateStep1()) goToStep(2);
  }

  async function handleStep2Next(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Edge Function: cria auth user + arena + perfil admin (service role interna)
      const { data, error } = await supabase.functions.invoke("register-arena-admin", {
        body: {
          adminName:     name.trim(),
          adminEmail:    email,
          adminPassword: password,
          arenaName:     arenaName.trim(),
        },
      });

      if (error || data?.error) {
        setGlobalError(data?.error ?? error?.message ?? "Erro inesperado.");
        return;
      }

      // Login automático após criação
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setGlobalError("Conta criada! Erro no login automático. Tente entrar manualmente.");
        return;
      }

      setArenaId(data.arenaId);
      goToStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validateStep3() || !arenaId) return;

    setLoading(true);
    try {
      // Edge Function: cria árbitro (JWT do admin validado internamente)
      const { data, error } = await supabase.functions.invoke("register-referee", {
        body: { arenaId, name: refName.trim(), email: refEmail, pin: refPin },
      });

      if (error || data?.error) {
        setPinError(true);
        setGlobalError(data?.error ?? error?.message ?? "Erro inesperado.");
        setTimeout(() => {
          setPinError(false);
          setPinReset((n) => n + 1);
          setRefPin("");
        }, 700);
        return;
      }

      goToStep("done");
    } finally {
      setLoading(false);
    }
  }

  const handlePinChange = useCallback((pin: string) => setRefPin(pin), []);

  // ── Tela de sucesso ─────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center step-slide-in">
          <div className="w-20 h-20 bg-yellow-400/10 border border-yellow-400/20 rounded-full
            flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Arena criada!</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Tudo configurado. Sua conta e arena estão prontas.
            <br />Vamos gerenciar seus campeonatos!
          </p>
          <Button size="lg" variant="primary" fullWidth onClick={() => router.push("/dashboard")}>
            Ir para o Dashboard
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const currentNum = step as number;

  return (
    <div className="w-full max-w-sm">

      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-3">
          <Trophy className="w-6 h-6 text-black" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Arena<span className="text-yellow-400">Ops</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-0.5">Criar minha conta</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-6">
        {STEPS.map((s, i) => (
          <Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={[
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                currentNum > s.num
                  ? "bg-yellow-400 text-black"
                  : currentNum === s.num
                    ? "bg-yellow-400 text-black ring-4 ring-yellow-400/20"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700",
              ].join(" ")}>
                {currentNum > s.num
                  ? <Check className="w-4 h-4" />
                  : <span>{s.num}</span>
                }
              </div>
              <span className={`text-xs font-medium ${
                currentNum >= s.num ? "text-yellow-400" : "text-zinc-600"
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={[
                "h-0.5 w-10 mx-2 mb-5 transition-all duration-500",
                currentNum > s.num ? "bg-yellow-400" : "bg-zinc-800",
              ].join(" ")} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

        {/* Erro global */}
        {globalError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl
            text-red-400 text-sm leading-relaxed">
            {globalError}
          </div>
        )}

        {/* ══ STEP 1 — Credenciais ══════════════════════════════════════════════ */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="flex flex-col gap-4 step-slide-in" noValidate>
            <div className="mb-1">
              <h2 className="text-lg font-bold text-white">Crie sua conta</h2>
              <p className="text-zinc-500 text-sm mt-0.5">Você será o administrador da arena.</p>
            </div>

            <div>
              <Label>Nome completo</Label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                className={inputCls(!!errs.name)}
                autoComplete="name"
              />
              <FieldError msg={errs.name} />
            </div>

            <div>
              <Label>E-mail</Label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@suaquadra.com.br"
                className={inputCls(!!errs.email)}
                autoComplete="email"
              />
              <FieldError msg={errs.email} />
            </div>

            <div>
              <Label>Senha</Label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={`${inputCls(!!errs.password)} pr-12`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errs.password} />
            </div>

            <div>
              <Label>Confirmar senha</Label>
              <input
                type={showPass ? "text" : "password"}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repita a senha"
                className={inputCls(!!errs.confirmPass)}
                autoComplete="new-password"
              />
              <FieldError msg={errs.confirmPass} />
            </div>

            <Button type="submit" size="lg" variant="primary" fullWidth className="mt-1">
              Avançar
              <ChevronRight className="w-4 h-4" />
            </Button>

            <p className="text-center text-zinc-600 text-xs">
              Já tem conta?{" "}
              <a href="/login" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                Entrar
              </a>
            </p>
          </form>
        )}

        {/* ══ STEP 2 — Arena ════════════════════════════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="flex flex-col gap-4 step-slide-in" noValidate>
            <div className="mb-1">
              <h2 className="text-lg font-bold text-white">Sua arena</h2>
              <p className="text-zinc-500 text-sm mt-0.5">
                Como se chama o seu complexo esportivo?
              </p>
            </div>

            <div>
              <Label>Nome da arena</Label>
              <input
                type="text"
                value={arenaName}
                onChange={(e) => setArenaName(e.target.value)}
                placeholder="Arena Central Esportes"
                className={inputCls(!!errs.arenaName)}
                autoFocus
              />
              <FieldError msg={errs.arenaName} />
            </div>

            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={() => goToStep(1)}
                aria-label="Voltar"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button type="submit" size="lg" variant="primary" fullWidth disabled={loading}>
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando arena...</>
                  : <>Criar Minha Arena <ChevronRight className="w-4 h-4" /></>
                }
              </Button>
            </div>
          </form>
        )}

        {/* ══ STEP 3 — Árbitro ══════════════════════════════════════════════════ */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="flex flex-col gap-5 step-slide-in" noValidate>
            <div className="mb-1">
              <h2 className="text-lg font-bold text-white">Adicionar árbitro</h2>
              <p className="text-zinc-500 text-sm mt-0.5">
                Cadastre o primeiro árbitro da sua arena.
              </p>
            </div>

            <div>
              <Label>Nome do árbitro</Label>
              <input
                type="text"
                value={refName}
                onChange={(e) => setRefName(e.target.value)}
                placeholder="Carlos Mendes"
                className={inputCls(!!errs.refName)}
                autoFocus
              />
              <FieldError msg={errs.refName} />
            </div>

            <div>
              <Label>E-mail do árbitro</Label>
              <input
                type="email"
                value={refEmail}
                onChange={(e) => setRefEmail(e.target.value)}
                placeholder="arbitro@email.com"
                className={inputCls(!!errs.refEmail)}
              />
              <FieldError msg={errs.refEmail} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                <span className="block text-center">PIN de acesso rápido (4 dígitos)</span>
              </Label>
              <PinInput
                onComplete={handlePinChange}
                onChange={handlePinChange}
                error={pinError}
                disabled={loading}
                resetTrigger={pinReset}
              />
              {errs.refPin
                ? <FieldError msg={errs.refPin} />
                : <p className="text-zinc-600 text-xs text-center">
                    O árbitro usará este PIN para login rápido na quadra
                  </p>
              }
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              fullWidth
              disabled={loading || refPin.length < 4}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</>
                : <><Check className="w-4 h-4" /> Concluir Setup</>
              }
            </Button>

            <button
              type="button"
              onClick={() => goToStep("done")}
              disabled={loading}
              className="text-zinc-500 hover:text-zinc-300 text-sm text-center
                transition-colors disabled:opacity-40"
            >
              Pular por agora →
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
