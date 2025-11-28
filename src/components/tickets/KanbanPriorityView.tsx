import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TicketCard } from './TicketCard';
import { KanbanColumn } from './KanbanColumn';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface KanbanPriorityViewProps {
  tickets: any[];
  priorities: any[];
  loading?: boolean;
  onUpdatePriority: (ticketId: string, priorityId: string) => Promise<void>;
  onView?: (ticket: any) => void;
  onEdit?: (ticket: any) => void;
  onDelete?: (ticket: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function KanbanPriorityView({
  tickets,
  priorities,
  loading = false,
  onUpdatePriority,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: KanbanPriorityViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ticketsByPriority, setTicketsByPriority] = useState<Record<string, any[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Organizar tickets por prioridad
  useEffect(() => {
    const grouped: Record<string, any[]> = {};
    
    priorities.forEach(priority => {
      grouped[priority.documentId] = [];
    });

    // Agregar columna para tickets sin prioridad
    grouped['no-priority'] = [];

    tickets.forEach(ticket => {
      const priorityId = ticket.ticket_priority?.documentId || 'no-priority';
      if (grouped[priorityId]) {
        grouped[priorityId].push(ticket);
      }
    });

    setTicketsByPriority(grouped);
  }, [tickets, priorities]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Si estamos sobre una columna (prioridad)
    const overPriorityId = Object.keys(ticketsByPriority).find(priorityId => 
      priorityId === overId || ticketsByPriority[priorityId].some(t => t.documentId === overId)
    );

    if (!overPriorityId) return;

    // Encontrar la prioridad actual del ticket
    const activePriorityId = Object.keys(ticketsByPriority).find(priorityId =>
      ticketsByPriority[priorityId].some(t => t.documentId === activeId)
    );

    if (!activePriorityId || activePriorityId === overPriorityId) return;

    // Actualizar localmente para feedback inmediato
    setTicketsByPriority(prev => {
      const activeTickets = [...prev[activePriorityId]];
      const overTickets = [...prev[overPriorityId]];

      const activeIndex = activeTickets.findIndex(t => t.documentId === activeId);
      const [movedTicket] = activeTickets.splice(activeIndex, 1);

      overTickets.push(movedTicket);

      return {
        ...prev,
        [activePriorityId]: activeTickets,
        [overPriorityId]: overTickets,
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const ticketId = active.id as string;
    
    // Buscar el ticket original en los datos del servidor
    const originalTicket = tickets.find(t => t.documentId === ticketId);
    if (!originalTicket) {
      console.error('Ticket no encontrado:', ticketId);
      return;
    }

    // Obtener la prioridad original del ticket
    const originalPriorityId = originalTicket.ticket_priority?.documentId || 'no-priority';

    // Determinar el ID de la nueva columna donde se soltó
    let newPriorityId = over.id as string;

    // Si soltamos sobre un ticket en lugar de la columna vacía, buscar la columna
    if (!ticketsByPriority[newPriorityId]) {
      const overTicket = tickets.find(t => t.documentId === newPriorityId);
      if (overTicket) {
        newPriorityId = Object.keys(ticketsByPriority).find(priorityId =>
          ticketsByPriority[priorityId].some(t => t.documentId === overTicket.documentId)
        ) || originalPriorityId;
      }
    }

    console.log('🎯 Drag End Priority:', {
      ticketId,
      originalPriorityId,
      newPriorityId,
      overId: over.id
    });

    // No hacer nada si soltamos en la misma columna
    if (newPriorityId === originalPriorityId) {
      console.log('⚠️ Misma columna, no actualizar');
      return;
    }

    // No actualizar si es "no-priority"
    if (newPriorityId === 'no-priority') {
      console.log('⚠️ Columna no-priority, revertir');
      // Revertir al estado original
      const grouped: Record<string, any[]> = {};
      priorities.forEach(priority => {
        grouped[priority.documentId] = [];
      });
      grouped['no-priority'] = [];
      tickets.forEach(ticket => {
        const priorityId = ticket.ticket_priority?.documentId || 'no-priority';
        if (grouped[priorityId]) {
          grouped[priorityId].push(ticket);
        }
      });
      setTicketsByPriority(grouped);
      return;
    }

    console.log('✅ Actualizando prioridad en servidor:', { ticketId, newPriorityId });

    try {
      await onUpdatePriority(ticketId, newPriorityId);
      console.log('✅ Prioridad actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error al actualizar prioridad:', error);
      // Revertir cambios si falla
      const grouped: Record<string, any[]> = {};
      priorities.forEach(priority => {
        grouped[priority.documentId] = [];
      });
      grouped['no-priority'] = [];
      tickets.forEach(ticket => {
        const priorityId = ticket.ticket_priority?.documentId || 'no-priority';
        if (grouped[priorityId]) {
          grouped[priorityId].push(ticket);
        }
      });
      setTicketsByPriority(grouped);
    }
  };

  const activeTicket = activeId 
    ? tickets.find(t => t.documentId === activeId)
    : null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
        {priorities.map(priority => (
          <KanbanColumn
            key={priority.documentId}
            id={priority.documentId}
            title={priority.name}
            color={priority.color}
            tickets={ticketsByPriority[priority.documentId] || []}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            showStatus={true}
            showPriority={false}
            showType={true}
          />
        ))}

        {ticketsByPriority['no-priority']?.length > 0 && (
          <KanbanColumn
            id="no-priority"
            title="Sin Prioridad"
            tickets={ticketsByPriority['no-priority']}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            showStatus={true}
            showPriority={false}
            showType={true}
          />
        )}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="rotate-3 scale-105">
            <TicketCard
              ticket={activeTicket}
              showStatus={true}
              showPriority={false}
              showType={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
