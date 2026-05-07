"use client";
import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarEvent } from "./AgendaApp";

type ChecklistItem = { id: string; text: string; done: boolean };

const COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316",
];

export default function EventModal({
  event,
  onClose,
  onRefresh,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [note, setNote] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [color, setColor] = useState("#6366f1");
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadNote = useCallback(async () => {
    const res = await fetch(`/api/notes?eventId=${event.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        setNote(data.content || "");
        setChecklist(
          Array.isArray(data.checklist)
            ? data.checklist
            : JSON.parse(data.checklist || "[]")
        );
        setColor(data.color || "#6366f1");
      }
    }
  }, [event.id]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const deleteEvent = async () => {
    setDeleting(true);
    await fetch(`/api/calendar?eventId=${event.id}`, { method: "DELETE" });
    await fetch(`/api/notes?eventId=${event.id}`, { method: "DELETE" });
    onRefresh();
    onClose();
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, content: note, checklist, color }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newItem.trim(), done: false },
    ]);
    setNewItem("");
  };

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const done = checklist.filter((i) => i.done).length;

  return (
    <div
      className="modal-overlay fixed inset-0 flex items-center justify-end z-50"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content h-full w-full max-w-md flex flex-col overflow-hidden shadow-2xl"
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{ background: color }}
              />
              <h2
                className="text-lg font-semibold leading-tight"
                style={{ color: "var(--text)" }}
              >
                {event.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Meta */}
          <div className="mt-3 space-y-1">
            {event.extendedProps?.rawStart && (
              <p className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.extendedProps.rawStart)}
                {event.extendedProps.rawEnd && ` → ${formatDate(event.extendedProps.rawEnd)}`}
              </p>
            )}
            {event.extendedProps?.location && (
              <p className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.extendedProps.location}
              </p>
            )}
            {event.extendedProps?.description && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {event.extendedProps.description}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Color tag */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Cor do evento
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              Observações
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione observações, links, contexto..."
              rows={5}
              className="w-full p-3 rounded-lg text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500/40 border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Checklist */}
          <div>
            <label className="text-xs font-medium mb-2 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
              <span>Checklist</span>
              {checklist.length > 0 && (
                <span>
                  {done}/{checklist.length}
                </span>
              )}
            </label>

            {/* Progress */}
            {checklist.length > 0 && (
              <div className="mb-3 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(done / checklist.length) * 100}%`, background: "var(--accent)" }}
                />
              </div>
            )}

            <div className="space-y-2 mb-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 rounded shrink-0"
                  />
                  <span
                    className="flex-1 text-sm"
                    style={{
                      color: item.done ? "var(--text-muted)" : "var(--text)",
                      textDecoration: item.done ? "line-through" : "none",
                    }}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 transition-all"
                    style={{ color: "#ef4444" }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="Novo item..."
                className="flex-1 px-3 py-1.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/40"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <button
                onClick={addItem}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: "var(--accent)" }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Fechar
            </button>
          </div>

          {/* Excluir */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 rounded-xl text-sm border transition-colors hover:bg-red-500/10"
              style={{ borderColor: "#ef444466", color: "#ef4444" }}
            >
              Excluir evento
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={deleteEvent}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#ef4444" }}
              >
                {deleting ? "Excluindo..." : "Confirmar exclusão"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
