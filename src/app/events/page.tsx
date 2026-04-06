// =============================================================================
// PÁGINA DE MIS EVENTOS - Module 4: Event Pass
// =============================================================================
// Lista de eventos creados por el usuario autenticado.
//
// ## Server Components y Autenticación
// Se verifica la cookie de sesión directamente en el servidor antes de
// renderizar la página, redirigiendo a /auth si no hay un token válido.
// =============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventList } from '@/components/EventList';
import { getEvents } from '@/data/events';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';

/**
 * Metadata de la página.
 */
export const metadata: Metadata = {
  title: 'Mis Eventos',
  description: 'Gestiona y administra los eventos que has creado.',
};

/**
 * Página de listado de eventos del usuario.
 */
export default async function MyEventsPage(): Promise<React.ReactElement> {
  // Validación de autenticación en el servidor
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-auth-token')?.value;

  if (!token) {
    redirect('/auth');
  }

  let uid = '';
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    uid = decodedToken.uid;
  } catch (error) {
    console.error('Error verificando token en Mis Eventos:', error);
    redirect('/auth');
  }

  // Fetch de eventos filtrando únicamente por el ID del organizador
  const events = await getEvents({ organizerId: uid });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Eventos</h1>
          <p className="mt-1 text-muted-foreground">
            {events.length} {events.length === 1 ? 'evento creado' : 'eventos creados'}
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Evento
          </Link>
        </Button>
      </div>

      {/* Lista de eventos */}
      <EventList
        events={events}
        emptyMessage="No has creado ningún evento aún."
      />
    </div>
  );
}