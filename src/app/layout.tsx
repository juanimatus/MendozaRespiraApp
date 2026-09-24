import type { Metadata, Viewport } from 'next';
// @ts-ignore: allows importing global CSS without type declarations
import './globals.css';
import { RoleProvider } from '@/lib/role-context';
import { Analytics } from "@vercel/analytics/next"
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Mendoza Respira AI',
  description: 'Plataforma GovTech para gestión inteligente del arbolado urbano en Mendoza',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'M. Respira',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#14261a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-stone-950 text-stone-100 font-sans antialiased">
        <RoleProvider>
          {children}
        </RoleProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
