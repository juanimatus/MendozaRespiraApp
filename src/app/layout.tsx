import type { Metadata, Viewport } from 'next';
import './globals.css';

// Usamos la pila de fuentes del sistema en vez de next/font/google:
// evita una dependencia de red en build time (fonts.googleapis.com),
// lo que hace el build más robusto en cualquier entorno de CI/CD.

export const metadata: Metadata = {
  title: 'Mendoza Respira',
  description: 'Mapa ciudadano de tocones y árboles talados en Mendoza',
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
        {children}
      </body>
    </html>
  );
}
