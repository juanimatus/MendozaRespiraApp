import { redirect } from 'next/navigation';

// La app abre directamente el mapa
export default function Home() {
  redirect('/mapa');
}
