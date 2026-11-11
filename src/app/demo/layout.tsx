import type { Metadata } from 'next';
import DemoShell from '@/components/demo/DemoShell';

export const metadata: Metadata = {
  title: 'Demo distribuidoras · Mendoza Respira',
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
