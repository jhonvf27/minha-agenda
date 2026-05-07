"use client";
import { format, parseISO, isTomorrow, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarEvent } from "./AgendaApp";
import MiniCalendar from "./MiniCalendar";
import QuickNotes from "./QuickNotes";

function formatEventTime(event: CalendarEvent): string {
  const rawStart = event.extendedProps?.rawStart;
  if (!rawStart || event.allDay) return "Dia todo";
  try { return format(parseISO(rawStart), "HH:mm"); } catch { return ""; }
}

const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#06b6d4"];
const getColor = (i: number) => COLORS[i % COLORS.length];

export default function TodaySidebar({
  todayEvents,
  allEvents,
  holidays,
  onEventClick,
  onDateClick,
  onClose,
}: {
  todayEvents: CalendarEvent[];
  allEvents: CalendarEvent[];
  holidays: { date: string; localName: string }[];
  onEventClick: (e: CalendarEvent) => void;
  onDateClick: (d: Date) => void;
  onClose: () => void;
}) {
  const now = new Date();
  const todayStr = format(now, "EEEE, dd 'de' MMMM", { locale: ptBR });

  const tomorrowEvents = allEvents.filter((e) => {
    try { return isTomorrow(parseISO(e.start.slice(0, 10))); } catch { return false; }
  });

  const upcomingEvents = allEvents.filter((e) => {
    try {
      const d = parseISO(e.start.slice(0, 10));
      return d > addDays(now, 1) && d <= addDays(now, 7);
    } catch { return false; }
  }).slice(0, 5);

  const todayHoliday = holidays.find((h) => h.date === format(now, "yyyy-MM-dd"));

  const allEventStarts = allEvents.map((e) => e.start);

  return (
    <aside
      className="w-64 shrink-0 flex flex-col border-r overflow-y-auto"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{todayStr}</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{format(now, "HH:mm")}</p>
          {todayHoliday && (
            <p className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>🎉 {todayHoliday.localName}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Mini Calendar */}
      <MiniCalendar eventDates={allEventStarts} onDateClick={onDateClick} />

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-2)" }}>
          <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{todayEvents.length}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Hoje</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-2)" }}>
          <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{tomorrowEvents.length + upcomingEvents.length}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Semana</p>
        </div>
      </div>

      {/* Today events */}
      <div className="px-4 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Hoje · {todayEvents.length}
        </p>
        {todayEvents.length === 0
          ? <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nenhum evento hoje 🎉</p>
          : <div className="space-y-1.5">
              {todayEvents.map((ev, i) => (
                <button key={ev.id} onClick={() => onEventClick(ev)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  style={{ background: "var(--surface-2)" }}>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: getColor(i) }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{ev.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatEventTime(ev)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
        }
      </div>

      {/* Tomorrow */}
      {tomorrowEvents.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Amanhã · {tomorrowEvents.length}</p>
          <div className="space-y-1.5">
            {tomorrowEvents.map((ev, i) => (
              <button key={ev.id} onClick={() => onEventClick(ev)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                style={{ background: "var(--surface-2)" }}>
                <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{ev.title}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatEventTime(ev)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Notes */}
      <QuickNotes />
    </aside>
  );
}
