"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, CheckCircle, Plus, Trash2, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type AthleteForm = {
  name: string;
  jerseyNumber: string;
  documentNumber: string;
  file: File | null;
  previewUrl: string;
};

type Phase = "form" | "loading" | "success" | "error";

function newAthlete(): AthleteForm {
  return { name: "", jerseyNumber: "", documentNumber: "", file: null, previewUrl: "" };
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-zinc-950 text-white rounded-xl px-4 py-3.5 text-sm placeholder-zinc-700 border border-zinc-800 outline-none focus:border-yellow-400 transition-colors";

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs font-bold mb-1.5 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}

// ── Athlete block ─────────────────────────────────────────────────────────────

function AthleteBlock({
  index,
  data,
  canRemove,
  onRemove,
  onChange,
  onFile,
}: {
  index: number;
  data: AthleteForm;
  canRemove: boolean;
  onRemove: () => void;
  onChange: (patch: Partial<AthleteForm>) => void;
  onFile: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      {/* Athlete header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-yellow-400 text-[11px] font-black uppercase tracking-widest">
          Atleta #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Field label="Nome Completo">
          <input
            type="text"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Nome do atleta"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nº Camisa">
            <input
              type="number"
              inputMode="numeric"
              value={data.jerseyNumber}
              onChange={e => onChange({ jerseyNumber: e.target.value })}
              placeholder="00"
              min={0}
              max={99}
              className={inputClass}
            />
          </Field>
          <Field label="CPF / RG">
            <input
              type="text"
              inputMode="numeric"
              value={data.documentNumber}
              onChange={e => onChange({ documentNumber: e.target.value })}
              placeholder="000.000.000-00"
              className={inputClass}
            />
          </Field>
        </div>

        {/* Document photo */}
        <div>
          <p className="text-zinc-500 text-xs font-bold mb-1.5 uppercase tracking-wide">
            Foto do Documento
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />

          {data.previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-yellow-400/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.previewUrl}
                alt="Documento"
                className="w-full h-36 object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-yellow-400 text-xs font-bold flex items-center gap-1.5 border border-yellow-400/30"
              >
                <Camera size={11} strokeWidth={2.5} />
                Trocar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-xl bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-yellow-400/15"
            >
              <Camera size={16} strokeWidth={2} />
              📸 Foto do Documento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InscricaoPage() {
  const params = useParams();
  const tournamentId = params.tournament_id as string;

  const [tournamentName, setTournamentName] = useState("");
  const [arenaId, setArenaId]               = useState<string | null>(null);
  const [notFound, setNotFound]             = useState(false);

  const [teamName, setTeamName]   = useState("");
  const [coachName, setCoachName] = useState("");
  const [athletes, setAthletes]   = useState<AthleteForm[]>([newAthlete()]);

  const [phase, setPhase]     = useState<Phase>("form");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Load tournament ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("tournaments")
      .select("name, arena_id")
      .eq("id", tournamentId)
      .single()
      .then(({ data }) => {
        if (!data) { setNotFound(true); return; }
        setTournamentName(data.name);
        setArenaId(data.arena_id);
      });
  }, [tournamentId]);

  // ── Athlete state helpers ────────────────────────────────────────────────────
  function updateAthlete(i: number, patch: Partial<AthleteForm>) {
    setAthletes(prev => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function handleFile(i: number, file: File) {
    const prev = athletes[i];
    if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
    updateAthlete(i, { file, previewUrl: URL.createObjectURL(file) });
  }

  function addAthlete() {
    setAthletes(prev => [...prev, newAthlete()]);
  }

  function removeAthlete(i: number) {
    const removed = athletes[i];
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    setAthletes(prev => prev.filter((_, idx) => idx !== i));
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!arenaId) return;

    if (!teamName.trim()) {
      setErrorMsg("Informe o nome do time.");
      return;
    }
    if (!coachName.trim()) {
      setErrorMsg("Informe o nome do técnico.");
      return;
    }
    for (let i = 0; i < athletes.length; i++) {
      const a = athletes[i];
      if (!a.name.trim()) {
        setErrorMsg(`Nome obrigatório no atleta #${i + 1}.`);
        return;
      }
      if (!a.jerseyNumber.trim()) {
        setErrorMsg(`Número de camisa obrigatório no atleta #${i + 1}.`);
        return;
      }
    }

    setErrorMsg("");
    setPhase("loading");

    try {
      const slugTeam = teamName
        .trim()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // ── A: Upload de fotos ─────────────────────────────────────────────────
      const photoUrls: (string | null)[] = await Promise.all(
        athletes.map(async (a, i) => {
          if (!a.file) return null;
          const ext  = a.file.name.split(".").pop() ?? "jpg";
          const uid  = typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}-${i}`;
          const path = `${tournamentId}/${slugTeam}/${uid}.${ext}`;
          const { error } = await supabase.storage
            .from("documents")
            .upload(path, a.file, { cacheControl: "3600", upsert: false });
          if (error) throw new Error(`Upload falhou (atleta #${i + 1}): ${error.message}`);
          return path;
        })
      );

      // ── B: Inserir time ────────────────────────────────────────────────────
      const { data: teamRow, error: teamErr } = await supabase
        .from("teams")
        .insert({
          name:          teamName.trim(),
          coach_name:    coachName.trim(),
          arena_id:      arenaId,
          tournament_id: tournamentId,
          status:        "pending",
        })
        .select("id")
        .single();
      if (teamErr || !teamRow) {
        throw new Error(teamErr?.message ?? "Falha ao criar a equipe.");
      }

      // ── C: Batch insert de atletas ─────────────────────────────────────────
      const { error: athErr } = await supabase.from("athletes").insert(
        athletes.map((a, i) => ({
          name:               a.name.trim(),
          jersey_number:      Number(a.jerseyNumber),
          document_number:    a.documentNumber.trim() || null,
          document_photo_url: photoUrls[i],
          team_id:            teamRow.id,
        }))
      );
      if (athErr) throw new Error(athErr.message);

      setPhase("success");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
      setPhase("error");
    }
  }

  // ── Loading overlay ──────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-6">
        <div className="w-14 h-14 rounded-full border-[3px] border-zinc-800 border-t-yellow-400 animate-spin" />
        <div className="text-center">
          <p className="text-white font-bold text-sm">Enviando inscrição…</p>
          <p className="text-zinc-600 text-xs mt-1">Aguarde, não feche a tela</p>
        </div>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-24 h-24 rounded-3xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mb-7">
          <CheckCircle size={44} className="text-yellow-400" strokeWidth={1.5} />
        </div>

        <h1 className="text-white font-black text-3xl leading-tight mb-4 tracking-tight">
          Equipe Registrada<br />com Sucesso!
        </h1>

        <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
          O regulamento e a tabela estarão disponíveis no Portal do Campeonato.
        </p>

        <div className="mt-8 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-left w-full max-w-xs">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">
            Campeonato
          </p>
          <p className="text-zinc-200 font-semibold text-sm">{tournamentName}</p>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">
              Equipe inscrita
            </p>
            <p className="text-yellow-400 font-black text-xl">{teamName}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">
              Atletas
            </p>
            <p className="text-zinc-300 font-bold text-sm">
              {athletes.length} {athletes.length === 1 ? "atleta" : "atletas"} cadastrado{athletes.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <p className="text-zinc-800 text-[10px] font-black tracking-widest uppercase mt-12">
          Coliseum
        </p>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Trophy size={48} className="text-zinc-800" />
        <p className="text-zinc-500 font-semibold">Campeonato não encontrado.</p>
        <p className="text-zinc-700 text-sm">Verifique o link com o organizador.</p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-lg mx-auto px-5 pb-20 pt-10">

        {/* Header */}
        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-0.5">
            <Trophy size={22} className="text-yellow-400" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Inscrição de Equipe
            </p>
            <h1 className="text-white font-black text-xl leading-tight">
              {tournamentName || (
                <span className="text-zinc-700 animate-pulse">Carregando…</span>
              )}
            </h1>
          </div>
        </div>

        {/* ── Sessão 1: A Equipe ─────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-6 h-6 rounded-lg bg-yellow-400/20 text-yellow-400 text-[11px] font-black flex items-center justify-center shrink-0">
              1
            </span>
            <h2 className="text-white font-black text-base uppercase tracking-wide">
              A Equipe
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Nome do Time">
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Ex: Leões do Asfalto FC"
                className={inputClass}
              />
            </Field>
            <Field label="Nome do Técnico">
              <input
                type="text"
                value={coachName}
                onChange={e => setCoachName(e.target.value)}
                placeholder="Nome completo do técnico"
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* ── Sessão 2: Os Atletas ───────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-6 h-6 rounded-lg bg-yellow-400/20 text-yellow-400 text-[11px] font-black flex items-center justify-center shrink-0">
              2
            </span>
            <h2 className="text-white font-black text-base uppercase tracking-wide">
              Os Atletas
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {athletes.map((a, i) => (
              <AthleteBlock
                key={i}
                index={i}
                data={a}
                canRemove={athletes.length > 1}
                onRemove={() => removeAthlete(i)}
                onChange={patch => updateAthlete(i, patch)}
                onFile={file => handleFile(i, file)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addAthlete}
            className="mt-4 w-full py-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 text-sm font-bold flex items-center justify-center gap-2 hover:border-yellow-400/50 hover:text-yellow-400 transition-colors active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Adicionar Novo Atleta
          </button>
        </section>

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-5 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-snug">
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!arenaId}
          className="w-full py-5 rounded-2xl bg-yellow-400 text-black font-black text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Concluir Inscrição da Equipe
        </button>

        {phase === "error" && (
          <button
            type="button"
            onClick={() => { setPhase("form"); setErrorMsg(""); }}
            className="mt-3 w-full py-3 text-zinc-500 text-sm font-semibold"
          >
            Tentar novamente
          </button>
        )}

        <p className="text-zinc-800 text-[10px] font-black tracking-widest uppercase text-center mt-10">
          Coliseum
        </p>
      </div>
    </div>
  );
}
