import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rutas que requieren rol municipal
const MUNICIPAL_ROUTES = ['/dashboard', '/inventario', '/reclamos', '/inspector'];
// Rutas exclusivas de admin
const ADMIN_ROUTES = ['/dashboard'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refrescar sesión (requerido por @supabase/ssr)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isMunicipalRoute = MUNICIPAL_ROUTES.some(r => pathname.startsWith(r));

  // Sin sesión intentando acceder a ruta municipal → login
  if (isMunicipalRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Con sesión intentando acceder a ruta municipal → verificar rol
  if (isMunicipalRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? 'ciudadano';
    if (role === 'ciudadano') {
      // Ciudadano autenticado no puede entrar a rutas municipales
      return NextResponse.redirect(new URL('/mapa', request.url));
    }
    if (ADMIN_ROUTES.some(r => pathname.startsWith(r)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/inspector', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
