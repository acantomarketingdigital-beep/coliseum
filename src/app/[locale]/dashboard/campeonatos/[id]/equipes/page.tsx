"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, ChevronRight, CreditCard,
  FileX2, Shield, Users, X, ZoomIn,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type TeamStatus = "pending" | "approved" | "rejected";

interface TeamRow {
  id: string;
  name: string;
  coach_name: string | null;
  status: TeamStatus;
}

interface AthleteRow {
  id: string;
  name: string;
  jersey_number: number;
  document_number: string | null;
  document_photo_url: string | null;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<TeamStatus, { label: string; badge: string; dot: string }> = {
  pending:  { label: "Pendente",  badge: "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30",  dot: "bg-yellow-400" },
  approved: { label: "Aprovado",  badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  rejected: { label: "Rejeitado", badge: "bg-red-500/15 text-red-400 border border-red-500/30",            dot: "bg-red-500" },
};

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCard({ team, onAnalyze }: { team: TeamRow; onAnalyze: () => void }) {
  const cfg = STATUS_CFG[team.status];
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{team.name}</p>
        <p className="text-zinc-500 text-xs truncate mt-0.5">
          {team.coach_name ?? "Técnico não informado"}
        </p>
      </div>

      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
        {cfg.label}
      </span>

      <button
        onClick={onAnalyze}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400 text-xs font-bold transition-colors whitespace-nowrap"
      >
        Analisar
        <ChevronRight size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── Athlete row inside drawer ─────────────────────────────────────────────────

function AthleteDocRow({
  athlete,
  signedUrl,
  loadingUrl,
  onViewDoc,
}: {
  athlete: AthleteRow;
  signedUrl: string | undefined;
  loadingUrl: boolean;
  onViewDoc: (url: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800/60 last:border-0">
      {/* Jersey number */}
      <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
        <span className="text-yellow-400 font-black text-sm">{athlete.jersey_number}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{athlete.name}</p>
        {athlete.document_number ? (
          <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
            <CreditCard size={10} strokeWidth={2} />
            {athlete.document_number}
          </p>
        ) : (
          <p className="text-zinc-700 text-xs italic mt-0.5">CPF/RG não informado</p>
        )}
      </div>

      {/* Document photo */}
      <div className="shrink-0">
        {!athlete.document_photo_url ? (
          <span className="flex items-center gap-1 text-zinc-700 text-[10px] font-semibold">
            <FileX2 size={12} strokeWidth={2} />
            Sem foto
          </span>
        ) : loadingUrl ? (
          <div className="w-14 h-10 rounded-lg bg-zinc-800 animate-pulse" />
        ) : signedUrl ? (
          <button
            onClick={() => onViewDoc(signedUrl)}
            className="relative w-14 h-10 rounded-lg overflow-hidden border border-zinc-700 hover:border-yellow-400/50 transition-colors group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signedUrl} alt="Documento" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={14} className="text-yellow-400" strokeWidth={2} />
            </div>
          </button>
        ) : (
          <span className="text-red-500 text-[10px] font-semibold">Erro</span>
        )}
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Documento do atleta"
        className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
      >
        <X size={18} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function Drawer({
  team,
  athletes,
  signedUrls,
  athletesLoading,
  updating,
  onClose,
  onViewDoc,
  onUpdateStatus,
}: {
  team: TeamRow;
  athletes: AthleteRow[];
  signedUrls: Map<string, string>;
  athletesLoading: boolean;
  updating: boolean;
  onClose: () => void;
  onViewDoc: (url: string) => void;
  onUpdateStatus: (status: "approved" | "rejected") => void;
}) {
  const cfg = STATUS_CFG[team.status];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isApproved  = team.status === "approved";
  const isRejected  = team.status === "rejected";
  const withPhoto   = athletes.filter(a => a.document_photo_url).length;
  const total       = athletes.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — slides from right */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 mt-0.5"
          >
            <X size={16} strokeWidth={2} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <h2 className="text-white font-black text-base leading-tight truncate">{team.name}</h2>
            {team.coach_name && (
              <p className="text-zinc-500 text-xs mt-0.5">Técnico: {team.coach_name}</p>
            )}
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 px-5 py-3 bg-zinc-900/50 border-b border-zinc-800/50 shrink-0">
          <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
            <Users size={12} strokeWidth={2} />
            <span className="font-semibold">{total} atleta{total !== 1 ? "s" : ""}</span>
          </span>
          <span className="h-3 w-px bg-zinc-800" />
          <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
            <Shield size={12} strokeWidth={2} />
            <span className="font-semibold">{withPhoto}/{total} com doc.</span>
          </span>
        </div>

        {/* Athletes list — scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-2">
          {athletesLoading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="w-14 h-10 rounded-lg bg-zinc-800 animate-pulse" />
                </div>
              ))}
            </div>
          ) : athletes.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <Users size={32} className="text-zinc-700" />
              <p className="text-zinc-600 text-sm">Nenhum atleta cadastrado.</p>
            </div>
          ) : (
            <div>
              {athletes.map(a => (
                <AthleteDocRow
                  key={a.id}
                  athlete={a}
                  signedUrl={signedUrls.get(a.id)}
                  loadingUrl={athletesLoading || (!!a.document_photo_url && !signedUrls.has(a.id))}
                  onViewDoc={onViewDoc}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-5 py-4 border-t border-zinc-800 shrink-0 space-y-3">
          {isApproved && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" strokeWidth={2} />
              <p className="text-emerald-400 text-sm font-semibold">Equipe aprovada</p>
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <X size={16} className="text-red-400 shrink-0" strokeWidth={2} />
              <p className="text-red-400 text-sm font-semibold">Inscrição rejeitada</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => onUpdateStatus("rejected")}
              disabled={updating || isRejected}
              className="flex-1 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-black text-sm hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {updating && isRejected ? "…" : "Rejeitar"}
            </button>
            <button
              onClick={() => onUpdateStatus("approved")}
              disabled={updating || isApproved}
              className="flex-1 py-3.5 rounded-xl bg-yellow-400 text-black font-black text-sm hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {updating && isApproved ? "…" : "Aprovar Equipe"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>
      <span className={`text-[10px] font-black ${color} opacity-60`}>{count}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EquipesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  // ── Page-level state ────────────────────────────────────────────────────────
  const [tournamentName, setTournamentName] = useState("");
  const [teams, setTeams]                   = useState<TeamRow[]>([]);
  const [loading, setLoading]               = useState(true);

  // ── Drawer state ────────────────────────────────────────────────────────────
  const [drawerTeam, setDrawerTeam]       = useState<TeamRow | null>(null);
  const [athletes, setAthletes]           = useState<AthleteRow[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [signedUrls, setSignedUrls]       = useState<Map<string, string>>(new Map());
  const [updating, setUpdating]           = useState(false);

  // ── Lightbox state ──────────────────────────────────────────────────────────
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ── Load tournament + teams ─────────────────────────────────────────────────
  const fetchTeams = useCallback(async () => {
    const [{ data: tData }, { data: teamsData }] = await Promise.all([
      supabase
        .from("tournaments")
        .select("name")
        .eq("id", tournamentId)
        .single(),
      supabase
        .from("teams")
        .select("id, name, coach_name, status")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true }),
    ]);

    if (tData) setTournamentName(tData.name);
    setTeams((teamsData ?? []) as TeamRow[]);
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  // ── Open drawer ─────────────────────────────────────────────────────────────
  async function openDrawer(team: TeamRow) {
    setDrawerTeam(team);
    setAthletes([]);
    setSignedUrls(new Map());
    setAthletesLoading(true);

    const { data } = await supabase
      .from("athletes")
      .select("id, name, jersey_number, document_number, document_photo_url")
      .eq("team_id", team.id)
      .order("jersey_number", { ascending: true });

    const rows = (data ?? []) as AthleteRow[];
    setAthletes(rows);

    // Generate signed URLs in parallel for all athletes with a photo
    const withDocs = rows.filter(a => a.document_photo_url);
    const entries = await Promise.all(
      withDocs.map(async (a) => {
        const { data: urlData } = await supabase.storage
          .from("documents")
          .createSignedUrl(a.document_photo_url!, 3600);
        return [a.id, urlData?.signedUrl ?? ""] as [string, string];
      })
    );

    setSignedUrls(new Map(entries.filter(([, url]) => url !== "")));
    setAthletesLoading(false);
  }

  function closeDrawer() {
    setDrawerTeam(null);
    setAthletes([]);
    setSignedUrls(new Map());
  }

  // ── Approve / reject ────────────────────────────────────────────────────────
  async function handleUpdateStatus(status: "approved" | "rejected") {
    if (!drawerTeam) return;
    setUpdating(true);

    const { error } = await supabase
      .from("teams")
      .update({ status })
      .eq("id", drawerTeam.id);

    if (!error) {
      const updated: TeamRow = { ...drawerTeam, status };
      setDrawerTeam(updated);
      setTeams(prev => prev.map(t => (t.id === drawerTeam.id ? updated : t)));
    }

    setUpdating(false);
  }

  // ── Derived lists ────────────────────────────────────────────────────────────
  const pending  = teams.filter(t => t.status === "pending");
  const approved = teams.filter(t => t.status === "approved");
  const rejected = teams.filter(t => t.status === "rejected");

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-900 px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm transition-colors mb-4"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar
          </button>

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-0.5">
                Auditoria de Inscrições
              </p>
              <h1 className="text-white font-black text-2xl tracking-tight leading-tight truncate">
                {tournamentName || "Carregando…"}
              </h1>
            </div>

            {/* Summary chips */}
            {!loading && (
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {pending.length > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-black">
                    {pending.length} pendente{pending.length !== 1 ? "s" : ""}
                  </span>
                )}
                {approved.length > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
                    <CheckCircle2 size={10} strokeWidth={2.5} />
                    {approved.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Teams list ───────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-16 animate-pulse" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Users size={32} className="text-zinc-700" />
            </div>
            <p className="text-white font-black text-lg">Nenhuma equipe inscrita</p>
            <p className="text-zinc-500 text-sm max-w-xs">
              Compartilhe o link de inscrição com os técnicos para receber as inscrições.
            </p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <SectionHeader label="Pendentes" count={pending.length} color="text-yellow-400" />
                <div className="space-y-2">
                  {pending.map(t => (
                    <TeamCard key={t.id} team={t} onAnalyze={() => openDrawer(t)} />
                  ))}
                </div>
              </section>
            )}

            {/* Approved */}
            {approved.length > 0 && (
              <section>
                <SectionHeader label="Aprovados" count={approved.length} color="text-emerald-400" />
                <div className="space-y-2">
                  {approved.map(t => (
                    <TeamCard key={t.id} team={t} onAnalyze={() => openDrawer(t)} />
                  ))}
                </div>
              </section>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <section>
                <SectionHeader label="Rejeitados" count={rejected.length} color="text-red-400" />
                <div className="space-y-2">
                  {rejected.map(t => (
                    <TeamCard key={t.id} team={t} onAnalyze={() => openDrawer(t)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* ── Drawer ───────────────────────────────────────────────────────────── */}
      {drawerTeam && (
        <Drawer
          team={drawerTeam}
          athletes={athletes}
          signedUrls={signedUrls}
          athletesLoading={athletesLoading}
          updating={updating}
          onClose={closeDrawer}
          onViewDoc={url => setLightboxUrl(url)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
