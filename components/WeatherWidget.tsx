"use client";
import { useEffect, useState } from "react";

type Weather = { temp: number; desc: string; emoji: string };

function codeToInfo(code: number): { desc: string; emoji: string } {
  if (code === 0) return { desc: "Céu limpo", emoji: "☀️" };
  if (code <= 3) return { desc: "Parcialmente nublado", emoji: "⛅" };
  if (code <= 48) return { desc: "Neblina", emoji: "🌫️" };
  if (code <= 55) return { desc: "Garoa", emoji: "🌦️" };
  if (code <= 65) return { desc: "Chuva", emoji: "🌧️" };
  if (code <= 75) return { desc: "Neve", emoji: "❄️" };
  if (code <= 82) return { desc: "Pancadas", emoji: "🌦️" };
  if (code <= 99) return { desc: "Tempestade", emoji: "⛈️" };
  return { desc: "Variável", emoji: "🌤️" };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setError(true); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode&timezone=auto`
          );
          const data = await res.json();
          const code: number = data.current.weathercode;
          const temp: number = Math.round(data.current.temperature_2m);
          const { desc, emoji } = codeToInfo(code);
          setWeather({ temp, desc, emoji });
        } catch { setError(true); }
      },
      () => setError(true),
      { timeout: 5000 }
    );
  }, []);

  if (error || !weather) return null;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      title={weather.desc}
    >
      <span>{weather.emoji}</span>
      <span className="font-medium" style={{ color: "var(--text)" }}>{weather.temp}°C</span>
      <span className="hidden sm:block">{weather.desc}</span>
    </div>
  );
}
