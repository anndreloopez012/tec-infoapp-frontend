import { useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const localizer = momentLocalizer(moment);

interface TicketCalendarViewProps {
  tickets: any[];
  loading: boolean;
  onView: (item: any) => void;
}

export function TicketCalendarView({ tickets, loading, onView }: TicketCalendarViewProps) {
  const events = useMemo(() => {
    return tickets.map(ticket => ({
      id: ticket.documentId,
      title: ticket.name || 'Sin nombre',
      start: new Date(ticket.createdAt),
      end: new Date(ticket.createdAt),
      resource: ticket,
    }));
  }, [tickets]);

  const handleSelectEvent = (event: any) => {
    onView(event.resource);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[600px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-2 md:p-6">
      <div className="h-[500px] md:h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
        views={['month', 'week', 'day']}
        defaultView="month"
        messages={{
          next: 'Siguiente',
          previous: 'Anterior',
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          agenda: 'Agenda',
          date: 'Fecha',
          time: 'Hora',
          event: 'Ticket',
          noEventsInRange: 'No hay tickets en este rango de fechas',
        }}
        eventPropGetter={(event) => {
          const ticket = event.resource;
          const priority = ticket.ticket_priority;
          const status = ticket.ticket_status;
          
          let backgroundColor = 'hsl(var(--primary))';
          
          if (priority?.color) {
            backgroundColor = priority.color;
          } else if (status?.color) {
            backgroundColor = status.color;
          }
          
          return {
            style: {
              backgroundColor,
              borderRadius: '4px',
              opacity: 0.9,
              color: 'white',
              border: 'none',
              display: 'block',
            },
          };
        }}
      />
      </div>
    </Card>
  );
}
