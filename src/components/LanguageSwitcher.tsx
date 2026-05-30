"use client";

import { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "pt", label: "PT — Português" },
  { code: "en", label: "EN — English" },
  { code: "es", label: "ES — Español" },
] as const;

interface LanguageSwitcherProps {
  /** "icon" mostra globo + código do idioma; "full" mostra as 3 opções diretamente */
  variant?: "icon" | "inline";
}

export function LanguageSwitcher({ variant = "icon" }: LanguageSwitcherProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const currentLocale = (params?.locale as string) ?? "pt";

  function switchLocale(next: string) {
    if (next === currentLocale) { setOpen(false); return; }
    // Substitui o segmento de locale na URL atual
    const newPath = pathname.replace(`/${currentLocale}`, `/${next}`);
    router.push(newPath);
    setOpen(false);
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1">
        {LOCALES.map(({ code }) => (
          <button
            key={code}
            onClick={() => switchLocale(code)}
            className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-colors ${
              currentLocale === code
                ? "text-yellow-400"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {code}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-zinc-800"
        aria-label="Alterar idioma"
      >
        <Globe size={13} strokeWidth={2} />
        <span className="uppercase">{currentLocale}</span>
      </button>

      {open && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute bottom-full mb-2 right-0 z-50 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px]">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`block w-full text-left px-4 py-3 text-xs font-bold transition-colors ${
                  currentLocale === code
                    ? "text-yellow-400 bg-yellow-400/8"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
