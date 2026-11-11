// ============================================================
// Acceso al demo privado: una contraseña que se configura en Vercel
// (variable DEMO_PASSWORD). Al entrar se guarda una cookie con un hash de
// la contraseña; si se cambia la contraseña, todas las sesiones caen.
// Sin DEMO_PASSWORD el demo queda cerrado.
// Funciona igual en el middleware (edge) y en las rutas de la API.
// ============================================================

export const DEMO_COOKIE = 'mr_demo';
export const DEMO_MAX_AGE = 60 * 60 * 24 * 7;   // una semana

export async function demoToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`mendoza-respira-demo:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidDemoCookie(value: string | undefined): Promise<boolean> {
  const password = process.env.DEMO_PASSWORD;
  if (!password || !value) return false;
  return safeEqual(value, await demoToken(password));
}
