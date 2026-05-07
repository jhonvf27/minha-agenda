"use client";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarEvent } from "./AgendaApp";

type Mode = "summary" | "suggest";

export default function AISummaryModal({
  events,
  onClose,
}: {
  events: CalendarEvent[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("summary");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const todayEvents = events.filter((e) =>
    e.start.startsWith(format(new Date(), "yyyy-MM-dd"))
  );

  const run = async (m: Mode) => {
    setMode(m);
    setText("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: m,
          date: today,
          events: todayEvents.map((e) => ({
            title: e.title,
            start: e.extendedProps?.rawStart ?? e.start,
            end: e.extendedProps?.rawEnd,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setText(data.text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao contatar IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Assistente IA</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Buttons */}
        <div className="p-4 flex gap-2 border-b" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => run("summary")}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === "summary" && text ? "var(--accent)" : "var(--surface-2)",
              color: mode === "summary" && text ? "#fff" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            📋 Resumo do dia
          </button>
          <button
            onClick={() => run("suggest")}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === "suggest" && text ? "var(--accent)" : "var(--surface-2)",
              color: mode === "suggest" && text ? "#fff" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            💡 Sugerir horários livres
          </button>
        </div>

        {/* Content */}
        <div className="p-5 min-h-48">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Analisando sua agenda...</p>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error.includes("ANTHROPIC_API_KEY") ? (
                <>
                  <p className="font-semibold mb-1">Chave da API não configurada</p>
                  <p className="text-xs opacity-80">Adicione <code>ANTHROPIC_API_KEY=sua-chave</code> no arquivo <code>.env.local</code> e reinicie o servidor.</p>
                </>
              ) : error}
            </div>
          )}
          {text && !loading && (
            <div className="prose prose-sm max-w-none">
              {text.split("\n").map((line, i) => (
                <p key={i} className="text-sm leading-relaxed mb-2" style={{ color: line.startsWith("•") || line.startsWith("-") ? "var(--text)" : "var(--text-muted)" }}>
                  {line}
                </p>
              ))}
            </div>
          )}
          {!text && !loading && !error && (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
              Escolha uma opção acima para começar
            </p>
          )}
        </div>

        {/* Today events summary */}
        <div className="px-5 pb-5">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Hoje ({today}): {todayEvents.length} evento{todayEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
