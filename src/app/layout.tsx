import type { Metadata, Viewport } from 'next';
// @ts-ignore: allows importing global CSS without type declarations
import './globals.css';
import { RoleProvider } from '@/lib/role-context';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Mendoza Respira AI',
  description: 'Plataforma GovTech para gestión inteligente del arbolado urbano en Mendoza',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1f4a26',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-stone-950 text-stone-100 font-sans antialiased">
        <RoleProvider>
          {children}
        </RoleProvider>
        <Analytics />
      </body>
    </html>
  );
}
