"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SanctionType } from "@/types/database";

const SANCTION_OPTIONS: { code: string; type: SanctionType; label: string; color: string }[] = [
  { code: "A", type: "warning",          label: "Advertência",      color: "bg-yellow-400 text-black" },
  { code: "P", type: "penalty",          label: "Penalidade",       color: "bg-orange-500 text-white" },
  { code: "E", type: "expulsion",        label: "Expulsão",         color: "bg-red-600 text-white"    },
  { code: "J", type: "disqualification", label: "Descredenciamento", color: "bg-red-900 text-white"  },
];

interface SanctionModalProps {
  matchId: string;
  setNumber: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  onClose: () => void;
}

export function SanctionModal({
  matchId,
  setNumber,
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  onClose,
}: SanctionModalProps) {
  const [teamSide, setTeamSide] = useState<"a" | "b" | null>(null);
  const [sanctionType, setSanctionType] = useState<SanctionType | null>(null);
  const [jersey, setJersey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = teamSide !== null && sanctionType !== null;

  async function handleConfirm() {
    if (!isValid) {
      setError("Selecione o time e o tipo de sanção.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: dbErr } = await supabase.from("match_sanctions").insert({
        match_id: matchId,
        team_side: teamSide,
        type: sanctionType,
        set_number: setNumber,
        jersey_number: jersey ? parseInt(jersey) : null,
        score_a_at: scoreA,
        score_b_at: scoreB,
      });

      if (dbErr) throw dbErr;
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao registrar sanção.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6">
      <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-[stepSlideIn_0.2s_ease-out]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold mb-1">
            Registrar Sanção
          </p>
          <p className="text-zinc-500 text-xs">
            Placar: {scoreA} × {scoreB}
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Seleção de time */}
          <div>
            <p className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              Time
            </p>
            <div className="flex gap-2">
              {(["a", "b"] as const).map((side) => {
                const name = side === "a" ? teamAName : teamBName;
                return (
                  <button
                    key={side}
                    onClick={() => setTeamSide(side)}
                    className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all truncate ${
                      teamSide === side
                        ? "bg-yellow-400 border-yellow-400 text-black"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo de sanção */}
          <div>
            <p className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              Tipo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SANCTION_OPTIONS.map(({ code, type, label, color }) => (
                <button
                  key={type}
                  onClick={() => setSanctionType(type)}
                  className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                    sanctionType === type
                      ? `${color} border-transparent`
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  <span className="font-black text-lg block">{code}</span>
                  <span className="text-[10px] font-semibold opacity-80">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nº da camiseta (opcional) */}
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              Nº Camiseta{" "}
              <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jersey}
              onChange={(e) => setJersey(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="–"
              className="w-24 h-12 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-xl font-black text-center focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || !isValid}
            className="flex-[2] py-3 rounded-xl bg-yellow-400 text-black font-black text-sm disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
