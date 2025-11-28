import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: any;
  onView?: (ticket: any) => void;
  onEdit?: (ticket: any) => void;
  onDelete?: (ticket: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  showStatus?: boolean;
  showPriority?: boolean;
  showType?: boolean;
}

export function TicketCard({
  ticket,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  showStatus = true,
  showPriority = true,
  showType = true,
}: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.documentId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-3 transition-all duration-200",
        isDragging && "opacity-50 scale-105 shadow-lg"
      )}
    >
      <Card className={cn(
        "hover:shadow-md transition-shadow cursor-pointer border-l-4",
        ticket.ticket_priority?.color 
          ? `border-l-[${ticket.ticket_priority.color}]` 
          : "border-l-primary"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <button
                {...attributes}
                {...listeners}
                className="mt-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-semibold text-sm leading-tight truncate"
                  onClick={() => onView?.(ticket)}
                >
                  {ticket.name}
                </h4>
                {ticket.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {ticket.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView?.(ticket)}
                className="h-7 w-7 p-0"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(ticket)}
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(ticket)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            {showStatus && ticket.ticket_status && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: ticket.ticket_status.color || undefined,
                  color: ticket.ticket_status.color || undefined 
                }}
              >
                {ticket.ticket_status.name}
              </Badge>
            )}
            {showPriority && ticket.ticket_priority && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: ticket.ticket_priority.color || undefined,
                  color: ticket.ticket_priority.color || undefined 
                }}
              >
                {ticket.ticket_priority.name}
              </Badge>
            )}
            {showType && ticket.ticket_type && (
              <Badge variant="secondary" className="text-xs">
                {ticket.ticket_type.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
