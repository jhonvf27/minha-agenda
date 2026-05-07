"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type Mode = "work" | "break";

const MODES: Record<Mode, { label: string; duration: number; color: string }> = {
  work:  { label: "Foco",    duration: 25 * 60, color: "#6366f1" },
  break: { label: "Pausa",   duration:  5 * 60, color: "#10b981" },
};

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
}

export default function PomodoroTimer({ eventTitle }: { eventTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = MODES[mode];
  const pct = timeLeft / cfg.duration;
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setTimeLeft(MODES[m].duration);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            beep();
            if (mode === "work") {
              setSessions((s) => s + 1);
              switchMode("break");
            } else {
              switchMode("work");
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, switchMode]);

  const reset = () => { setTimeLeft(cfg.duration); setRunning(false); };
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
        style={{
          borderColor: running ? cfg.color : "var(--border)",
          color: running ? cfg.color : "var(--text-muted)",
        }}
        title="Pomodoro"
      >
        🍅
        {running && <span>{mm}:{ss}</span>}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-10 w-64 rounded-2xl shadow-2xl z-50 p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Mode tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: "var(--surface-2)" }}>
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: mode === m ? cfg.color : "transparent",
                  color: mode === m ? "#fff" : "var(--text-muted)",
                }}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Circle timer */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="48" cy="48" r={radius} fill="none"
                  stroke={cfg.color} strokeWidth="6"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform="rotate(-90 48 48)"
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
                  {mm}:{ss}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{cfg.label}</span>
              </div>
            </div>

            {eventTitle && (
              <p className="text-xs text-center truncate w-full px-2" style={{ color: "var(--text-muted)" }}>
                📌 {eventTitle}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: cfg.color }}
            >
              {running ? "Pausar" : "Iniciar"}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              ↺
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            {sessions} sessão{sessions !== 1 ? "ões" : ""} concluída{sessions !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
