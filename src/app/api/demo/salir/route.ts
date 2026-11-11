import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE } from '@/lib/demo/access';

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL('/demo/ingresar', request.url), { status: 303 });
  res.cookies.set(DEMO_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
