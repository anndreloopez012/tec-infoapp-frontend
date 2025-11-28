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
    const overId = over.id as string;

    // Encontrar la nueva prioridad
    let newPriorityId = overId;
    if (!priorities.find(p => p.documentId === overId) && overId !== 'no-priority') {
      // Si no es un ID de prioridad directamente, buscar en qué columna está el ticket sobre el que soltamos
      newPriorityId = Object.keys(ticketsByPriority).find(priorityId =>
        ticketsByPriority[priorityId].some(t => t.documentId === overId)
      ) || '';
    }

    if (newPriorityId && newPriorityId !== 'no-priority') {
      try {
        await onUpdatePriority(ticketId, newPriorityId);
      } catch (error) {
        console.error('Error al actualizar prioridad:', error);
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
        {/* Columnas para cada prioridad */}
        {priorities.map(priority => (
          <Card key={priority.documentId} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {priority.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: priority.color }}
                    />
                  )}
                  <span>{priority.name}</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {ticketsByPriority[priority.documentId]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <SortableContext
                  id={priority.documentId}
                  items={ticketsByPriority[priority.documentId]?.map(t => t.documentId) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 pr-3">
                    {ticketsByPriority[priority.documentId]?.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                        Arrastra tickets aquí
                      </div>
                    ) : (
                      ticketsByPriority[priority.documentId]?.map(ticket => (
                        <TicketCard
                          key={ticket.documentId}
                          ticket={ticket}
                          onView={onView}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          showStatus={true}
                          showPriority={false}
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

        {/* Columna para tickets sin prioridad */}
        {ticketsByPriority['no-priority']?.length > 0 && (
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Sin Prioridad</span>
                <Badge variant="secondary" className="ml-2">
                  {ticketsByPriority['no-priority'].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <SortableContext
                  id="no-priority"
                  items={ticketsByPriority['no-priority'].map(t => t.documentId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 pr-3">
                    {ticketsByPriority['no-priority'].map(ticket => (
                      <TicketCard
                        key={ticket.documentId}
                        ticket={ticket}
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
