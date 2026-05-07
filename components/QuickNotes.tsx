"use client";
import { useState, useEffect, useRef } from "react";

export default function QuickNotes() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/quicknotes").then((r) => r.json()).then((d) => setContent(d.content ?? ""));
  }, []);

  const handleChange = (val: string) => {
    setContent(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      await fetch("/api/quicknotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: val }),
      });
      setSaving(false);
    }, 800);
  };

  return (
    <div className="border-t" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>📝</span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Notas Rápidas
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>}
          <svg
            width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Anote qualquer coisa aqui... salva automaticamente."
            rows={5}
            className="w-full p-3 text-xs rounded-xl resize-none outline-none border focus:ring-2 focus:ring-indigo-500/30 leading-relaxed"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
              color: "var(--text)",
              fontFamily: "inherit",
            }}
          />
        </div>
      )}
    </div>
  );
}
