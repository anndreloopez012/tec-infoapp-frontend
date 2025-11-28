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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TicketCard } from './TicketCard';
import { Skeleton } from '@/components/ui/skeleton';

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
    
    // Si soltamos sobre un ticket, encontrar su columna
    const overTicket = tickets.find(t => t.documentId === newStatusId);
    if (overTicket) {
      newStatusId = Object.keys(ticketsByStatus).find(statusId =>
        ticketsByStatus[statusId].some(t => t.documentId === overTicket.documentId)
      ) || currentStatusId;
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
        {/* Columnas para cada estado */}
        {statuses.map(status => (
          <Card key={status.documentId} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {status.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                  )}
                  <span>{status.name}</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {ticketsByStatus[status.documentId]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <SortableContext
                  id={status.documentId}
                  items={ticketsByStatus[status.documentId]?.map(t => t.documentId) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div 
                    className="space-y-2 pr-3 min-h-[200px]"
                    data-status-id={status.documentId}
                  >
                    {ticketsByStatus[status.documentId]?.length === 0 ? (
                      <div 
                        id={status.documentId}
                        className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg min-h-[150px] flex items-center justify-center"
                      >
                        Arrastra tickets aquí
                      </div>
                    ) : (
                      ticketsByStatus[status.documentId]?.map(ticket => (
                        <TicketCard
                          key={ticket.documentId}
                          ticket={ticket}
                          onView={onView}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          showStatus={false}
                          showPriority={true}
                          showType={true}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {/* Columna para tickets sin estado */}
        {ticketsByStatus['no-status']?.length > 0 && (
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Sin Estado</span>
                <Badge variant="secondary" className="ml-2">
                  {ticketsByStatus['no-status'].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <SortableContext
                  id="no-status"
                  items={ticketsByStatus['no-status'].map(t => t.documentId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 pr-3">
                    {ticketsByStatus['no-status'].map(ticket => (
                      <TicketCard
                        key={ticket.documentId}
                        ticket={ticket}
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
                  </div>
                </SortableContext>
              </ScrollArea>
            </CardContent>
          </Card>
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
