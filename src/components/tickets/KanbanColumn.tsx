import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TicketCard } from './TicketCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  color?: string;
  tickets: any[];
  onView?: (ticket: any) => void;
  onEdit?: (ticket: any) => void;
  onDelete?: (ticket: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  showStatus?: boolean;
  showPriority?: boolean;
  showType?: boolean;
}

export function KanbanColumn({
  id,
  title,
  color,
  tickets,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  showStatus = true,
  showPriority = true,
  showType = true,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <span>{title}</span>
          </div>
          <Badge variant="secondary" className="ml-2">
            {tickets.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <SortableContext
            id={id}
            items={tickets.map(t => t.documentId)}
            strategy={verticalListSortingStrategy}
          >
            <div 
              ref={setNodeRef}
              className={`space-y-2 pr-3 min-h-[200px] rounded-lg border-2 border-dashed transition-colors p-2 ${
                isOver ? 'border-primary/60 bg-primary/5' : 'border-border/40'
              }`}
            >
              {tickets.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8 flex items-center justify-center">
                  Arrastra tickets aquí
                </div>
              ) : (
                tickets.map(ticket => (
                  <TicketCard
                    key={ticket.documentId}
                    ticket={ticket}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    showStatus={showStatus}
                    showPriority={showPriority}
                    showType={showType}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
