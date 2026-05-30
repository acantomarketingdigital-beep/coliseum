import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["pt", "en", "es"] as const;
const DEFAULT_LOCALE = "pt";

type Locale = (typeof LOCALES)[number];

function detectLocale(pathname: string): Locale | null {
  const first = pathname.split("/")[1] as Locale;
  return LOCALES.includes(first) ? first : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar assets estáticos e rotas internas do Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.(.+)$/.test(pathname) // qualquer arquivo com extensão
  ) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // ── Roteamento de locale ─────────────────────────────────────────────────
  const locale = detectLocale(pathname);

  if (!locale) {
    // Sem prefixo → redireciona para o locale padrão
    const target = new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, { status: 307 });
  }

  // ── Proteção de rotas (auth) ─────────────────────────────────────────────
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Extrai o path sem o prefixo de locale para a verificação de regras
  const pathWithoutLocale = pathname.slice(`/${locale}`.length) || "/";
  const isProtected = pathWithoutLocale.startsWith("/dashboard");
  const isLoginPage = pathWithoutLocale === "/login";

  if (!user && isProtected) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  // Intercepta todas as rotas exceto assets com extensão e internos do Next.js
  matcher: ["/((?!_next|api|favicon\\.ico|manifest\\.json|icons|.*\\..*).*)"],
};
