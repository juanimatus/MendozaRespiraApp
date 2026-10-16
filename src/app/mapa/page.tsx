import { redirect } from 'next/navigation';

// El mapa simple se unificó con el explorador; se mantiene la ruta por links viejos.
export default function MapaPage() {
  redirect('/feed');
}
