"use client";
import { useState } from "react";

const CATEGORIES = [
  { label: "Trabalho",  color: "#6366f1", icon: "💼" },
  { label: "Pessoal",   color: "#ec4899", icon: "🏠" },
  { label: "Saúde",     color: "#10b981", icon: "💪" },
  { label: "Estudos",   color: "#f59e0b", icon: "📚" },
  { label: "Lazer",     color: "#06b6d4", icon: "🎮" },
  { label: "Outro",     color: "#8b5cf6", icon: "📌" },
];

const RECURRENCE = [
  { label: "Não repete",        value: "" },
  { label: "Todos os dias",     value: "RRULE:FREQ=DAILY" },
  { label: "Toda semana",       value: "RRULE:FREQ=WEEKLY" },
  { label: "A cada 2 semanas",  value: "RRULE:FREQ=WEEKLY;INTERVAL=2" },
  { label: "Todo mês",          value: "RRULE:FREQ=MONTHLY" },
];

export default function NewEventModal({
  start,
  end,
  allDay,
  onClose,
  onCreated,
}: {
  start: string;
  end: string;
  allDay: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(allDay ? `${start}T09:00` : start.slice(0, 16));
  const [endTime, setEndTime]     = useState(allDay ? `${start}T10:00` : end.slice(0, 16));
  const [category, setCategory]   = useState(CATEGORIES[0]);
  const [recurrence, setRecurrence] = useState(RECURRENCE[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) { setError("Digite um título"); return; }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        summary: `${category.icon} ${title}`,
        description: `[${category.label}]${description ? "\n" + description : ""}`,
        location,
        colorId: colorToGoogleId(category.color),
        start: { dateTime: new Date(startTime).toISOString(), timeZone: "America/Sao_Paulo" },
        end:   { dateTime: new Date(endTime).toISOString(),   timeZone: "America/Sao_Paulo" },
      };
      if (recurrence) body.recurrence = [recurrence];

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      onCreated();
    } catch {
      setError("Erro ao criar evento. Faça logout e login novamente para renovar o acesso.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Novo Evento</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Título */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do evento *"
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />

          {/* Categoria */}
          <div>
            <label className="text-xs mb-2 block font-medium" style={{ color: "var(--text-muted)" }}>Categoria</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: category.label === cat.label ? cat.color + "22" : "transparent",
                    borderColor: category.label === cat.label ? cat.color : "var(--border)",
                    color: category.label === cat.label ? cat.color : "var(--text-muted)",
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Início</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/40"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Fim</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/40"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          {/* Recorrência */}
          <div>
            <label className="text-xs mb-1 block font-medium" style={{ color: "var(--text-muted)" }}>Repetição</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/40"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              {RECURRENCE.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Local */}
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Local (opcional)"
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />

          {/* Descrição */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="p-4 border-t flex gap-2" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: category.color }}
          >
            {saving ? "Criando..." : "Criar Evento"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function colorToGoogleId(hex: string): string {
  const map: Record<string, string> = {
    "#6366f1": "9",  // blueberry
    "#ec4899": "4",  // flamingo
    "#10b981": "2",  // sage
    "#f59e0b": "5",  // banana
    "#06b6d4": "7",  // peacock
    "#8b5cf6": "3",  // grape
  };
  return map[hex] ?? "9";
}
