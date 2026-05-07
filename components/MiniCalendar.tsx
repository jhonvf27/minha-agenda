"use client";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function MiniCalendar({
  eventDates,
  onDateClick,
}: {
  eventDates: string[];
  onDateClick: (date: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const today = new Date();

  const start = startOfMonth(viewMonth);
  const end = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start); // 0=Sun

  const hasEvent = (d: Date) =>
    eventDates.some((s) => s.startsWith(format(d, "yyyy-MM-dd")));

  return (
    <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          ‹
        </button>
        <span className="text-xs font-semibold capitalize" style={{ color: "var(--text)" }}>
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium py-0.5" style={{ color: "var(--text-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, viewMonth);
          const hasEv = hasEvent(day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => { onDateClick(day); setViewMonth(day); }}
              className="relative flex flex-col items-center justify-center w-full aspect-square rounded-full text-xs transition-colors hover:bg-white/10"
              style={{
                background: isToday ? "var(--accent)" : "transparent",
                color: isToday ? "#fff" : inMonth ? "var(--text)" : "var(--text-muted)",
                fontWeight: isToday ? 700 : 400,
              }}
            >
              {format(day, "d")}
              {hasEv && !isToday && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
