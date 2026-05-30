"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const POSITIONS = ["I", "II", "III", "IV", "V", "VI"] as const;

interface TeamRow {
  jerseys: string[];    // index 0-5 = posições I-VI
  liberoIdx: number | null; // qual posição é o líbero (-1 = nenhum)
}

function emptyTeam(): TeamRow {
  return { jerseys: ["", "", "", "", "", ""], liberoIdx: null };
}

interface LineupModalProps {
  matchId: string;
  setNumber: number;
  teamAName: string;
  teamBName: string;
  onConfirm: () => void;
  onSkip: () => void;
}

export function LineupModal({
  matchId,
  setNumber,
  teamAName,
  teamBName,
  onConfirm,
  onSkip,
}: LineupModalProps) {
  const [lineupA, setLineupA] = useState<TeamRow>(emptyTeam());
  const [lineupB, setLineupB] = useState<TeamRow>(emptyTeam());
  const [saving, setSaving] = useState(false);

  function updateJersey(
    team: "a" | "b",
    posIdx: number,
    value: string
  ) {
    const cleaned = value.replace(/\D/g, "").slice(0, 2);
    const setter = team === "a" ? setLineupA : setLineupB;
    setter((prev) => {
      const jerseys = [...prev.jerseys];
      jerseys[posIdx] = cleaned;
      return { ...prev, jerseys };
    });
  }

  function toggleLibero(team: "a" | "b", posIdx: number) {
    const setter = team === "a" ? setLineupA : setLineupB;
    setter((prev) => ({
      ...prev,
      liberoIdx: prev.liberoIdx === posIdx ? null : posIdx,
    }));
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      const rows: {
        match_id: string;
        set_number: number;
        team_side: string;
        position: number;
        jersey_number: number | null;
        is_libero: boolean;
      }[] = [];

      for (let i = 0; i < 6; i++) {
        const jA = lineupA.jerseys[i];
        const jB = lineupB.jerseys[i];
        if (jA !== "") {
          rows.push({
            match_id: matchId,
            set_number: setNumber,
            team_side: "a",
            position: i + 1,
            jersey_number: parseInt(jA),
            is_libero: lineupA.liberoIdx === i,
          });
        }
        if (jB !== "") {
          rows.push({
            match_id: matchId,
            set_number: setNumber,
            team_side: "b",
            position: i + 1,
            jersey_number: parseInt(jB),
            is_libero: lineupB.liberoIdx === i,
          });
        }
      }

      if (rows.length > 0) {
        await supabase
          .from("set_lineups")
          .upsert(rows, { onConflict: "match_id,set_number,team_side,position" });
      }

      onConfirm();
    } catch (e) {
      console.warn("lineup save failed:", e);
      onConfirm(); // não bloqueia o jogo
    } finally {
      setSaving(false);
    }
  }

  const setLabel = setNumber === 5 ? "TIE-BREAK" : `${setNumber}° SET`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-[stepSlideIn_0.2s_ease-out]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold mb-1">
            Súmula — Formação
          </p>
          <h2 className="text-white font-black text-xl">
            {setLabel} — Ordem de Saque
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Posições I–VI com nº da camiseta. Marque o líbero (L).
          </p>
        </div>

        {/* Tabela de formação */}
        <div className="px-6 py-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-zinc-500 font-semibold pb-2 pr-3 w-28">
                  Time
                </th>
                {POSITIONS.map((pos) => (
                  <th
                    key={pos}
                    className="text-center text-zinc-400 font-bold pb-2 w-12"
                  >
                    {pos}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(
                [
                  { side: "a" as const, name: teamAName, data: lineupA },
                  { side: "b" as const, name: teamBName, data: lineupB },
                ] as const
              ).map(({ side, name, data }) => (
                <tr key={side}>
                  <td className="py-3 pr-3">
                    <span className="text-white font-bold text-xs leading-tight block truncate max-w-[7rem]">
                      {name}
                    </span>
                  </td>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <td key={i} className="py-3 px-0.5">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={data.jerseys[i]}
                          onChange={(e) => updateJersey(side, i, e.target.value)}
                          placeholder="–"
                          className={`
                            w-10 h-10 text-center rounded-xl border text-sm font-black
                            bg-zinc-950 text-white focus:outline-none
                            transition-colors
                            ${data.jerseys[i]
                              ? "border-yellow-400/60 text-yellow-400"
                              : "border-zinc-700 text-zinc-500"
                            }
                            focus:border-yellow-400
                          `}
                        />
                        {/* Botão líbero */}
                        <button
                          onClick={() => toggleLibero(side, i)}
                          className={`text-[10px] font-black rounded px-1 transition-colors ${
                            data.liberoIdx === i
                              ? "bg-yellow-400 text-black"
                              : "text-zinc-600 hover:text-zinc-400"
                          }`}
                          title="Marcar como líbero"
                        >
                          L
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legenda */}
        <div className="px-6 pb-2">
          <p className="text-zinc-600 text-[10px]">
            I = servidor inicial · L = líbero (pode substituir qualquer jogador de defesa)
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:border-zinc-600 hover:text-white transition-colors"
          >
            Pular por agora
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-[2] py-3 rounded-xl bg-yellow-400 text-black font-black text-sm tracking-wide disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Confirmar Formação"}
          </button>
        </div>
      </div>
    </div>
  );
}
