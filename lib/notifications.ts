import type { CalendarEvent } from "@/components/AgendaApp";

const scheduled = new Map<string, ReturnType<typeof setTimeout>>();

export async function requestPermission() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function scheduleNotifications(events: CalendarEvent[], minutesBefore = 15) {
  // Clear previous
  scheduled.forEach((id) => clearTimeout(id));
  scheduled.clear();

  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const now = Date.now();

  events.forEach((ev) => {
    const rawStart = ev.extendedProps?.rawStart;
    if (!rawStart || ev.allDay) return;

    try {
      const eventTime = new Date(rawStart).getTime();
      const notifyAt = eventTime - minutesBefore * 60 * 1000;
      const delay = notifyAt - now;

      if (delay < 0 || delay > 7 * 24 * 60 * 60 * 1000) return; // skip past or >7 days

      const timeoutId = setTimeout(() => {
        new Notification(`📅 ${ev.title}`, {
          body: `Começa em ${minutesBefore} minutos`,
          icon: "/avatar.jpg",
          tag: ev.id,
        });
      }, delay);

      scheduled.set(ev.id, timeoutId);
    } catch {}
  });
}
