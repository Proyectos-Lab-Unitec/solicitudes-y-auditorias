import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada petición y protege las rutas privadas.
 *
 * Se llama desde src/proxy.ts (Next.js 16: el antiguo middleware ahora se llama
 * proxy).
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Sin configuración (desarrollo inicial) no se intenta autenticar.
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // No ejecutar código entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const esRutaPublica =
    path === "/login" || path === "/registro" || path.startsWith("/auth/");

  if (!user && !esRutaPublica) {
    const destino = request.nextUrl.clone();
    // Guarda la ruta original para volver a ella después del login.
    const next = `${path}${request.nextUrl.search}`;

    destino.pathname = "/login";
    destino.search = "";
    destino.searchParams.set("next", next);

    return NextResponse.redirect(destino);
  }

  if (user && path === "/") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/panel";
    return NextResponse.redirect(destino);
  }

  return response;
}
