import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Mendoza Respira',
  description: 'Mapa ciudadano de tocones y árboles talados en Mendoza',
  manifest: '/manifest.json',
  themeColor: '#1f4a26',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-stone-950 text-stone-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
