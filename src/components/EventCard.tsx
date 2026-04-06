// =============================================================================
// COMPONENTE EVENT CARD - Module 4: Event Pass
// =============================================================================

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, Tag, Pencil } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types/event';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types/event';
import { formatShortDate, formatPrice, getAvailableSpots } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  currentUserId?: string; // UID del usuario autenticado (viene del servidor)
}

export function EventCard({ event, currentUserId }: EventCardProps): React.ReactElement {
  const availableSpots = getAvailableSpots(event.capacity, event.registeredCount);
  const isSoldOut = availableSpots === 0;
  const isAvailable = event.status === 'publicado' && !isSoldOut;
  
  // Verificación de propiedad (Ownership)
  const isOwner = currentUserId === event.organizerId;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md border-muted/60">
      {/* Imagen del evento */}
      <div className="relative aspect-video">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted/50">
            <Tag className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Badge de "Mi Evento" si el usuario es el dueño */}
        {isOwner && (
          <div className="absolute left-3 bottom-3">
            <Badge className="bg-primary/90 backdrop-blur-sm border-none shadow-sm">
              Tu evento
            </Badge>
          </div>
        )}

        {/* Overlay con fecha */}
        <div className="absolute left-3 top-3 rounded-lg bg-background/95 px-2.5 py-1 backdrop-blur-sm border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-tighter">
            {formatShortDate(event.date)}
          </p>
        </div>

        {/* Badge de estado (solo si no es el flujo normal de publicación) */}
        {event.status !== 'publicado' && (
          <div className="absolute right-3 top-3">
            <Badge 
              variant={event.status === 'cancelado' ? 'destructive' : 'secondary'}
              className="shadow-sm"
            >
              {STATUS_LABELS[event.status]}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold tracking-widest">
            {CATEGORY_LABELS[event.category]}
          </Badge>
          <Link
            href={`/events/${event.id}`}
            className="line-clamp-2 text-lg font-bold leading-tight hover:text-primary transition-colors"
          >
            {event.title}
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
          <span className="line-clamp-1">{event.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Users className="h-4 w-4 shrink-0 text-primary/70" />
          <span className={isSoldOut ? "text-destructive font-bold" : ""}>
            {isSoldOut ? "Agotado" : `${availableSpots} lugares libres`}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-muted/5 py-3">
        <p className="text-xl font-black text-primary">{formatPrice(event.price)}</p>
        
        <div className="flex gap-2">
          {/* Acción exclusiva del Dueño */}
          {isOwner && (
            <Button asChild variant="outline" size="sm" className="h-8 border-primary/20 hover:bg-primary/5">
              <Link href={`/events/${event.id}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Link>
            </Button>
          )}

          <Button asChild variant={isAvailable ? 'default' : 'secondary'} size="sm" className="h-8 font-semibold">
            <Link href={`/events/${event.id}`}>
              {isAvailable ? 'Ver más' : 'Detalles'}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}