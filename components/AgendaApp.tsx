"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type { EventClickArg, DateSelectArg, EventInput, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import Image from "next/image";
import { format } from "date-fns";
import EventModal from "./EventModal";
import NewEventModal from "./NewEventModal";
import TodaySidebar from "./TodaySidebar";
import PomodoroTimer from "./PomodoroTimer";
import WeatherWidget from "./WeatherWidget";
import AISummaryModal from "./AISummaryModal";
import { requestPermission, scheduleNotifications } from "@/lib/notifications";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  extendedProps?: {
    description?: string;
    location?: string;
    rawStart?: string;
    rawEnd?: string;
  };
};

type Holiday = { date: string; localName: string };

// Curated Unsplash backgrounds per month (0=Jan … 11=Dec)
const MONTH_BG = [
  "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1600&q=20&auto=format", // Jan
  "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1600&q=20&auto=format", // Feb
  "https://images.unsplash.com/photo-1490750967868-88de44ad029b?w=1600&q=20&auto=format", // Mar
  "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1600&q=20&auto=format", // Apr
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=20&auto=format", // May
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=20&auto=format", // Jun
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=20&auto=format", // Jul
  "https://images.unsplash.com/photo-1476984251899-8d7fdfc5c92e?w=1600&q=20&auto=format", // Aug
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&q=20&auto=format", // Sep
  "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=1600&q=20&auto=format", // Oct
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1ef40a?w=1600&q=20&auto=format", // Nov
  "https://images.unsplash.com/photo-1482517967863-f65ef12b5ffe?w=1600&q=20&auto=format", // Dec
];

export default function AgendaApp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventDate, setNewEventDate] = useState<{ start: string; end: string; allDay: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifMinutes, setNotifMinutes] = useState(15);
  const [notifGranted, setNotifGranted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => { if (status === "unauthenticated") router.push("/"); }, [status, router]);
  useEffect(() => { requestPermission().then(setNotifGranted); }, []);

  // Fetch Brazilian holidays
  useEffect(() => {
    const year = new Date().getFullYear();
    fetch(`/api/holidays?year=${year}`).then((r) => r.json()).then(setHolidays).catch(() => {});
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      const res = await fetch(`/api/calendar?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped: CalendarEvent[] = (data || []).map((e: Record<string, unknown>) => {
        const startInfo = e.start as Record<string, string>;
        const endInfo = e.end as Record<string, string>;
        return {
          id: e.id as string,
          title: (e.summary as string) || "(sem título)",
          start: startInfo?.dateTime || startInfo?.date || "",
          end: endInfo?.dateTime || endInfo?.date,
          allDay: !startInfo?.dateTime,
          extendedProps: {
            description: e.description as string,
            location: e.location as string,
            rawStart: startInfo?.dateTime || startInfo?.date,
            rawEnd: endInfo?.dateTime || endInfo?.date,
          },
        };
      });
      setEvents(mapped);
      scheduleNotifications(mapped, notifMinutes);
    } catch {} finally { setLoading(false); }
  }, [notifMinutes]);

  useEffect(() => { if (session) fetchEvents(); }, [session, fetchEvents]);
  useEffect(() => { if (events.length) scheduleNotifications(events, notifMinutes); }, [notifMinutes, events]);

  const handleEventDrop = async (arg: EventDropArg) => {
    const ev = arg.event;
    const body = ev.allDay
      ? { start: { date: ev.startStr }, end: { date: ev.endStr } }
      : { start: { dateTime: ev.start!.toISOString(), timeZone: "America/Sao_Paulo" }, end: { dateTime: ev.end!.toISOString(), timeZone: "America/Sao_Paulo" } };
    const res = await fetch(`/api/calendar?eventId=${ev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) arg.revert();
  };

  const handleEventResize = async (arg: EventResizeDoneArg) => {
    const ev = arg.event;
    const body = { start: { dateTime: ev.start!.toISOString(), timeZone: "America/Sao_Paulo" }, end: { dateTime: ev.end!.toISOString(), timeZone: "America/Sao_Paulo" } };
    const res = await fetch(`/api/calendar?eventId=${ev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) arg.revert();
  };

  const handleDateClick = (date: Date) => {
    calendarRef.current?.getApi().gotoDate(date);
  };

  const exportPDF = () => {
    window.print();
  };

  // Map holidays to FullCalendar events
  const holidayEvents: EventInput[] = holidays.map((h) => ({
    id: `holiday-${h.date}`,
    title: `🎉 ${h.localName}`,
    start: h.date,
    allDay: true,
    display: "background",
    color: "rgba(245,158,11,0.15)",
    classNames: ["holiday-event"],
  }));

  const filteredEvents: EventInput[] = events
    .filter((e) => searchQuery ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) : true)
    .map((e) => ({ ...e }));

  const todayEvents = events.filter((e) => e.start.startsWith(format(new Date(), "yyyy-MM-dd")));
  const nextTodayEvent = todayEvents.find((e) => {
    const rs = e.extendedProps?.rawStart;
    return rs && new Date(rs) >= new Date();
  });

  const bgImage = MONTH_BG[currentMonth];

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {sidebarOpen && (
        <TodaySidebar
          todayEvents={todayEvents}
          allEvents={events}
          holidays={holidays}
          onEventClick={(e) => setSelectedEvent(e)}
          onDateClick={handleDateClick}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b gap-4 shrink-0 print:hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text-muted)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0"
                style={{ borderColor: "var(--accent)", background: "var(--surface-2)" }}>
                <Image src="/avatar.jpg" alt="Jhon" width={32} height={32} className="object-cover w-full h-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <span className="font-semibold text-sm hidden sm:block" style={{ color: "var(--text)" }}>Minha Agenda</span>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar eventos..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/40"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }} />
          </div>

          <div className="flex items-center gap-2">
            {/* Weather */}
            <WeatherWidget />

            {/* AI */}
            <button onClick={() => setShowAI(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              title="Assistente IA">
              ✨ IA
            </button>

            {/* Export PDF */}
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              title="Exportar PDF">
              📄 PDF
            </button>

            {/* Notification */}
            <div className="relative">
              <button onClick={async () => { if (!notifGranted) { const ok = await requestPermission(); setNotifGranted(ok); } setNotifOpen((o) => !o); }}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ color: notifGranted ? "var(--accent)" : "var(--text-muted)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-10 flex items-center gap-2 rounded-xl p-3 shadow-xl z-50 whitespace-nowrap"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Lembrete:</span>
                    {[5, 10, 15, 30].map((m) => (
                      <button key={m} onClick={() => { setNotifMinutes(m); setNotifOpen(false); }}
                        className="text-xs px-2 py-1 rounded-lg transition-colors"
                        style={{ background: notifMinutes === m ? "var(--accent)" : "var(--surface-2)", color: notifMinutes === m ? "#fff" : "var(--text-muted)" }}>
                        {m}min
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pomodoro */}
            <PomodoroTimer eventTitle={nextTodayEvent?.title} />

            {/* Sync */}
            <button onClick={fetchEvents} disabled={loading} className="p-2 rounded-lg hover:bg-white/5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                style={{ color: "var(--text-muted)" }} className={loading ? "animate-spin" : ""}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {session?.user?.image && (
              <Image src={session.user.image} alt="" width={28} height={28} className="rounded-full" />
            )}
            <button onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs px-3 py-1.5 rounded-lg border hover:bg-white/5"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              Sair
            </button>
          </div>
        </header>

        {/* Calendar with background */}
        <div className="flex-1 min-h-0 p-4 relative">
          {/* Month background image */}
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${bgImage})`, opacity: 0.04 }}
          />
          <div className="relative h-full">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
              events={[...filteredEvents, ...holidayEvents]}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={4}
              weekends={true}
              height="100%"
              datesSet={(arg) => setCurrentMonth(arg.view.currentStart.getMonth())}
              eventClick={(arg: EventClickArg) => {
                if (arg.event.id.startsWith("holiday-")) return;
                const ev = events.find((e) => e.id === arg.event.id);
                if (ev) setSelectedEvent(ev);
              }}
              select={(arg: DateSelectArg) => setNewEventDate({ start: arg.startStr, end: arg.endStr, allDay: arg.allDay })}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
            />
          </div>
        </div>
      </div>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onRefresh={fetchEvents} />}
      {newEventDate && (
        <NewEventModal start={newEventDate.start} end={newEventDate.end} allDay={newEventDate.allDay}
          onClose={() => setNewEventDate(null)} onCreated={() => { setNewEventDate(null); fetchEvents(); }} />
      )}
      {showAI && <AISummaryModal events={events} onClose={() => setShowAI(false)} />}
    </div>
  );
}
