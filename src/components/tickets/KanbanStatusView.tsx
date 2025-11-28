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

interface KanbanStatusViewProps {
  tickets: any[];
  statuses: any[];
  loading?: boolean;
  onUpdateStatus: (ticketId: string, statusId: string) => Promise<void>;
  onView?: (ticket: any) => void;
  onEdit?: (ticket: any) => void;
  onDelete?: (ticket: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function KanbanStatusView({
  tickets,
  statuses,
  loading = false,
  onUpdateStatus,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: KanbanStatusViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ticketsByStatus, setTicketsByStatus] = useState<Record<string, any[]>>({});

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

  // Organizar tickets por estado
  useEffect(() => {
    const grouped: Record<string, any[]> = {};
    
    statuses.forEach(status => {
      grouped[status.documentId] = [];
    });

    // Agregar columna para tickets sin estado
    grouped['no-status'] = [];

    tickets.forEach(ticket => {
      const statusId = ticket.ticket_status?.documentId || 'no-status';
      if (grouped[statusId]) {
        grouped[statusId].push(ticket);
      }
    });

    setTicketsByStatus(grouped);
  }, [tickets, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Si estamos sobre una columna (estado)
    const overStatusId = Object.keys(ticketsByStatus).find(statusId => 
      statusId === overId || ticketsByStatus[statusId].some(t => t.documentId === overId)
    );

    if (!overStatusId) return;

    // Encontrar el estado actual del ticket
    const activeStatusId = Object.keys(ticketsByStatus).find(statusId =>
      ticketsByStatus[statusId].some(t => t.documentId === activeId)
    );

    if (!activeStatusId || activeStatusId === overStatusId) return;

    // Actualizar localmente para feedback inmediato
    setTicketsByStatus(prev => {
      const activeTickets = [...prev[activeStatusId]];
      const overTickets = [...prev[overStatusId]];

      const activeIndex = activeTickets.findIndex(t => t.documentId === activeId);
      const [movedTicket] = activeTickets.splice(activeIndex, 1);

      overTickets.push(movedTicket);

      return {
        ...prev,
        [activeStatusId]: activeTickets,
        [overStatusId]: overTickets,
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const ticketId = active.id as string;

    // Encontrar en qué columna está el ticket actualmente en el estado local
    const currentStatusId = Object.keys(ticketsByStatus).find(statusId =>
      ticketsByStatus[statusId].some(t => t.documentId === ticketId)
    );

    if (!currentStatusId) return;

    // Determinar el ID de la nueva columna
    let newStatusId = over.id as string;

    // Si soltamos sobre un ticket, encontrar su columna; si soltamos sobre la columna, over.id ya es el ID de columna
    if (!ticketsByStatus[newStatusId]) {
      const overTicket = tickets.find(t => t.documentId === newStatusId);
      if (overTicket) {
        newStatusId = Object.keys(ticketsByStatus).find(statusId =>
          ticketsByStatus[statusId].some(t => t.documentId === overTicket.documentId)
        ) || currentStatusId;
      }
    }

    // No hacer nada si soltamos en la misma columna
    if (newStatusId === currentStatusId) {
      return;
    }

    // No actualizar si es "no-status"
    if (newStatusId === 'no-status') {
      // Revertir al estado original
      const grouped: Record<string, any[]> = {};
      statuses.forEach(status => {
        grouped[status.documentId] = [];
      });
      grouped['no-status'] = [];
      tickets.forEach(ticket => {
        const statusId = ticket.ticket_status?.documentId || 'no-status';
        if (grouped[statusId]) {
          grouped[statusId].push(ticket);
        }
      });
      setTicketsByStatus(grouped);
      return;
    }

    try {
      await onUpdateStatus(ticketId, newStatusId);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      // Revertir cambios si falla
      const grouped: Record<string, any[]> = {};
      statuses.forEach(status => {
        grouped[status.documentId] = [];
      });
      grouped['no-status'] = [];
      tickets.forEach(ticket => {
        const statusId = ticket.ticket_status?.documentId || 'no-status';
        if (grouped[statusId]) {
          grouped[statusId].push(ticket);
        }
      });
      setTicketsByStatus(grouped);
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
        {statuses.map(status => (
          <KanbanColumn
            key={status.documentId}
            id={status.documentId}
            title={status.name}
            color={status.color}
            tickets={ticketsByStatus[status.documentId] || []}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            showStatus={false}
            showPriority={true}
            showType={true}
          />
        ))}

        {ticketsByStatus['no-status']?.length > 0 && (
          <KanbanColumn
            id="no-status"
            title="Sin Estado"
            tickets={ticketsByStatus['no-status']}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            showStatus={false}
            showPriority={true}
            showType={true}
          />
        )}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="rotate-3 scale-105">
            <TicketCard
              ticket={activeTicket}
              showStatus={false}
              showPriority={true}
              showType={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
