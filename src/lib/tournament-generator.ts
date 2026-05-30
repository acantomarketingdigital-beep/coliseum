// ── Algoritmo Round-Robin (Berger) ────────────────────────────────────────────
// "Todos contra todos" — cada par de times se enfrenta exatamente uma vez.
// Times ímpares recebem um BYE (folga) rotativo por rodada.

export const BYE_ID = "__BYE__";

export interface GeneratedMatch {
  teamAId: string;
  teamBId: string;
  roundNumber: number;
}

export interface GeneratedRound {
  roundNumber: number;
  matches: GeneratedMatch[];
  byeTeamId: string | null; // time em folga nesta rodada (times ímpares)
}

export interface TournamentSchedule {
  rounds: GeneratedRound[];
  totalRounds: number;
  totalMatches: number; // partidas reais (excluindo byes)
}

/**
 * Gera um calendário Round-Robin completo para N times.
 * Complexidade: O(n²) tempo, O(n²) espaço.
 *
 * @param teamIds - Array de IDs dos times participantes (mínimo 2)
 * @throws Error se menos de 2 times forem fornecidos
 */
export function generateRoundRobin(teamIds: string[]): TournamentSchedule {
  if (teamIds.length < 2) {
    throw new Error("São necessários pelo menos 2 times para gerar o campeonato.");
  }

  // Algoritmo de rotação circular de Berger
  // Fix [0], rota [1..n-1] sentido anti-horário a cada rodada
  const teams = [...teamIds];
  const hasOdd = teams.length % 2 !== 0;
  if (hasOdd) teams.push(BYE_ID); // BYE torna o número par

  const n = teams.length; // sempre par
  const rounds: GeneratedRound[] = [];
  let totalMatches = 0;

  for (let r = 0; r < n - 1; r++) {
    const matches: GeneratedMatch[] = [];
    let byeTeamId: string | null = null;

    for (let i = 0; i < n / 2; i++) {
      const a = teams[i];
      const b = teams[n - 1 - i];

      if (a === BYE_ID) {
        byeTeamId = b;
      } else if (b === BYE_ID) {
        byeTeamId = a;
      } else {
        matches.push({ teamAId: a, teamBId: b, roundNumber: r + 1 });
        totalMatches++;
      }
    }

    rounds.push({ roundNumber: r + 1, matches, byeTeamId });

    // Rotação: mantém teams[0] fixo, move teams[n-1] para teams[1]
    const last = teams.splice(n - 1, 1)[0];
    teams.splice(1, 0, last);
  }

  return { rounds, totalRounds: n - 1, totalMatches };
}

/**
 * Calcula o número de rodadas e jogos sem executar o algoritmo completo.
 * Útil para o preview instantâneo na UI.
 */
export function previewStats(teamCount: number): { rounds: number; matches: number } {
  if (teamCount < 2) return { rounds: 0, matches: 0 };
  const n = teamCount % 2 === 0 ? teamCount : teamCount + 1; // normaliza para par
  return {
    rounds: n - 1,
    matches: (teamCount * (teamCount - 1)) / 2,
  };
}
