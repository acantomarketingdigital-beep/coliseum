import { Trophy, Zap, Wifi, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const features = [
  {
    icon: Trophy,
    title: "Gestão de Campeonatos",
    description: "Crie e gerencie torneios, tabelas e fases eliminatórias com total controle.",
  },
  {
    icon: Zap,
    title: "Súmula Digital em Tempo Real",
    description: "Registre gols, faltas e cartões ao vivo, sem depender de internet.",
  },
  {
    icon: Wifi,
    title: "Offline-First",
    description: "Funciona em quadras sem sinal. Sincroniza automaticamente ao reconectar.",
  },
  {
    icon: Shield,
    title: "Arbitragem Segura",
    description: "Histórico imutável de eventos com timestamp para disputas e recursos.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <Badge variant="live" className="mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-arena-pulse" />
          MVP em construção
        </Badge>

        <h1 className="font-display text-6xl md:text-8xl text-white uppercase tracking-tight leading-none mb-4">
          Arena<span className="text-yellow-400">Ops</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          O sistema definitivo de gestão e arbitragem de campeonatos esportivos.
          Opere em qualquer quadra, com ou sem internet.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:w-auto">
          <Button size="xl" variant="primary">
            <Trophy className="w-5 h-5" />
            Começar agora
          </Button>
          <Button size="xl" variant="secondary">
            Ver demonstração
          </Button>
        </div>
      </section>

      {/* Scoreboard demo */}
      <section className="px-4 pb-16 max-w-2xl mx-auto w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 glow-yellow">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="live">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-arena-pulse" />
              Ao Vivo
            </Badge>
            <span className="text-zinc-500 text-xs font-mono">24&apos;</span>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-center flex-1">
              <p className="text-white font-bold text-sm uppercase tracking-widest mb-2">Falcões</p>
              <span className="font-display text-7xl text-yellow-400 leading-none">3</span>
            </div>

            <div className="text-zinc-600 font-bold text-2xl px-4">×</div>

            <div className="text-center flex-1">
              <p className="text-white font-bold text-sm uppercase tracking-widest mb-2">Leões</p>
              <span className="font-display text-7xl text-white leading-none">2</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-center gap-2 text-zinc-500 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>Futsal · 1º Tempo · Arena Ops</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="p-5">
              <CardBody className="p-0">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
