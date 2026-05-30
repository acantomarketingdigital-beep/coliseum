"use client";

import { Trophy, Users, Swords, LogOut, ChevronRight, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";

const ROLE_LABEL: Record<string, string> = {
  arena_admin: "Administrador",
  referee:     "Árbitro",
  coach:       "Técnico",
};

const quickActions = [
  { icon: Swords,   label: "Nova Partida",      description: "Iniciar súmula ao vivo",  href: "/dashboard/matches/new" },
  { icon: Users,    label: "Times & Atletas",   description: "Gerenciar elencos",         href: "/dashboard/teams" },
  { icon: Calendar, label: "Agenda",            description: "Partidas agendadas",        href: "/dashboard/schedule" },
  { icon: Trophy,   label: "Campeonatos",       description: "Torneios e tabelas",        href: "/dashboard/championships" },
];

export default function DashboardPage() {
  const { profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-6">

      {/* Boas-vindas */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-sm mb-1">Bem-vindo de volta</p>
          <h1 className="text-2xl font-bold text-white">
            {profile?.name ?? "Usuário"}
          </h1>
          {profile?.role && (
            <Badge variant="live" className="mt-2">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </Badge>
          )}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm transition-colors p-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>

      {/* Placar rápido / placeholder */}
      <Card accent className="p-5">
        <CardBody className="p-0">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="live">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-arena-pulse" />
              Sistema pronto
            </Badge>
          </div>
          <p className="text-zinc-400 text-sm">
            Nenhuma partida em andamento. Use{" "}
            <span className="text-yellow-400 font-semibold">Nova Partida</span>{" "}
            para iniciar uma súmula ao vivo.
          </p>
        </CardBody>
      </Card>

      {/* Ações rápidas */}
      <div>
        <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left
                hover:border-zinc-700 hover:bg-zinc-800/50 active:scale-95
                transition-all duration-150 focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-yellow-400"
              onClick={() => {/* navegação futura */}}
            >
              <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-3">
                <action.icon className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-white text-sm font-semibold leading-tight">{action.label}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{action.description}</p>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 mt-2" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
