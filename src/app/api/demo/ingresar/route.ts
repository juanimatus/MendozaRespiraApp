import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE, DEMO_MAX_AGE, demoToken, safeEqual } from '@/lib/demo/access';

// Límite simple de intentos por IP (en memoria del servidor)
const attempts = new Map<string, { count: number; since: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function POST(request: NextRequest) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: 'El demo no está habilitado.' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now - entry.since < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Demasiados intentos. Probá en 15 minutos.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const given = typeof body?.password === 'string' ? body.password : '';
  const [expected, received] = await Promise.all([demoToken(password), demoToken(given)]);

  if (!safeEqual(expected, received)) {
    const fresh = !entry || now - entry.since >= WINDOW_MS;
    attempts.set(ip, { count: fresh ? 1 : entry!.count + 1, since: fresh ? now : entry!.since });
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE, expected, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   DEMO_MAX_AGE,
  });
  return res;
}
