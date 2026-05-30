"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface SubstitutionModalProps {
  matchId: string;
  setNumber: number;
  teamSide: "a" | "b";
  teamName: string;
  scoreA: number;
  scoreB: number;
  onClose: () => void;
}

export function SubstitutionModal({
  matchId,
  setNumber,
  teamSide,
  teamName,
  scoreA,
  scoreB,
  onClose,
}: SubstitutionModalProps) {
  const [jerseyOut, setJerseyOut] = useState("");
  const [jerseyIn, setJerseyIn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    jerseyOut.length > 0 &&
    jerseyIn.length > 0 &&
    jerseyOut !== jerseyIn;

  async function handleConfirm() {
    if (!isValid) {
      setError("Informe camisetas distintas para saída e entrada.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: dbErr } = await supabase
        .from("match_substitutions")
        .insert({
          match_id: matchId,
          team_side: teamSide,
          set_number: setNumber,
          jersey_out: parseInt(jerseyOut),
          jersey_in: parseInt(jerseyIn),
          score_a_at: scoreA,
          score_b_at: scoreB,
        });

      if (dbErr) throw dbErr;
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar substituição.";
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
            Substituição
          </p>
          <h2 className="text-white font-black text-lg truncate">{teamName}</h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            Placar atual: {scoreA} × {scoreB}
          </p>
        </div>

        {/* Inputs */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              ↑ Jogador que SAI (nº camiseta)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jerseyOut}
              onChange={(e) => setJerseyOut(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="Ex: 07"
              autoFocus
              className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-950 text-white text-2xl font-black text-center focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              ↓ Jogador que ENTRA (nº camiseta)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jerseyIn}
              onChange={(e) => setJerseyIn(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="Ex: 12"
              className="w-full h-14 rounded-2xl border border-zinc-700 bg-zinc-950 text-white text-2xl font-black text-center focus:outline-none focus:border-yellow-400 transition-colors"
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
            {saving ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
